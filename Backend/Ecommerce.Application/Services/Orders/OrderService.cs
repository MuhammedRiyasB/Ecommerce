using AutoMapper;
using Ecommerce.Application.Common.ProductOptions;
using Ecommerce.Application.DTOs.Address;
using Ecommerce.Application.DTOs.Orders;
using Ecommerce.Application.Interfaces.Email;
using Ecommerce.Application.Interfaces.Orders;
using Ecommerce.Domain.Common;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;
using Ecommerce.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Application.Services.Orders
{
    public class OrderService : IOrderService
    {
        private readonly IRepository<Order> _orderRepo;
        private readonly IRepository<Domain.Entities.Cart> _cartRepo;
        private readonly IRepository<CartItem> _cartItemRepo;
        private readonly IRepository<Product> _productRepo;
        private readonly IRepository<Address> _addressRepo;
        private readonly IRepository<OrderItem> _orderItemRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IEmailJobQueue _emailJobQueue;

        public OrderService(
            IRepository<Order> orderRepo,
            IRepository<Domain.Entities.Cart> cartRepo,
            IRepository<CartItem> cartItemRepo,
            IRepository<Product> productRepo,
            IRepository<Address> addressRepo,
            IRepository<OrderItem> orderItemRepo,
            IRepository<User> userRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IEmailJobQueue emailJobQueue)
        {
            _orderRepo = orderRepo;
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _productRepo = productRepo;
            _addressRepo = addressRepo;
            _orderItemRepo = orderItemRepo;
            _userRepo = userRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _emailJobQueue = emailJobQueue;
        }

        public async Task<UpdateOrderStatusResponseDto> ChangeOrderStatusAsync(Guid orderId, string status)
        {
            if (!Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
            {
                return new UpdateOrderStatusResponseDto { Message = "invalidstatus" };
            }

            var order = await _orderRepo.Query().FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order not found" };
            }

            order.OrderStatus = parsedStatus;
            _orderRepo.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await QueueOrderLifecycleEmailAsync(
                order,
                $"Order status updated - {order.OrderId}",
                "Order status updated",
                $"Your order status is now <strong>{System.Net.WebUtility.HtmlEncode(parsedStatus.ToString())}</strong>.");

            return new UpdateOrderStatusResponseDto
            {
                OrderStatus = parsedStatus.ToString(),
                Message = "Order status updated successfully"
            };
        }

        public async Task<bool> CreateOrderAsync(Guid userId, CreateOrderRequestDto dto)
        {
            var paymentMethod = dto.PaymentMethod?.Trim().ToLowerInvariant();
            if (paymentMethod is not ("card" or "cod"))
            {
                throw new ArgumentException("A valid payment method is required.");
            }

            var existingOrder = await _orderRepo.Query().AnyAsync(o => o.TransactionId == dto.TransactionId);
            if (existingOrder)
            {
                throw new ArgumentException("An order with this transaction ID already exists.");
            }

            var address = await _addressRepo.Query()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.AddressId == dto.AddressId && s.UserId == userId && !s.IsDeleted);
            if (address == null) throw new ArgumentException("Cannot find the address");

            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .Include(c => c.CartItems).ThenInclude(ci => ci.ProductVariant)
                .ThenInclude(v => v.Product)
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product).ThenInclude(p => p.Variants)
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null || cart.CartItems == null || !cart.CartItems.Any())
            {
                throw new ArgumentException("Your cart is empty");
            }

            EnsureAddressCanReceiveCart(cart, address.Pincode.Trim());

            var serverTotalPrice = cart.CartItems.Sum(c => c.Quantity * (c.Product.Price - c.Product.Discount));
            var order = CreateOrderFromCart(userId, dto, cart, serverTotalPrice);

            ValidateStockAndDeductQuantities(cart);

            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                await _orderRepo.AddAsync(order);
                _cartItemRepo.RemoveRange(cart.CartItems);
                await _unitOfWork.SaveChangesAsync();
            });

            try
            {
                await QueueOrderConfirmationEmailAsync(userId, order);
            }
            catch
            {
                // Order is already committed; queue failures must not roll back a completed purchase.
            }
            return true;
        }

        public async Task<bool> CanDeliverCartToAddressAsync(Guid userId, Guid addressId)
        {
            var address = await _addressRepo.Query()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.AddressId == addressId && s.UserId == userId && !s.IsDeleted);
            if (address == null)
            {
                return false;
            }

            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .Include(c => c.CartItems).ThenInclude(ci => ci.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null || !cart.CartItems.Any())
            {
                return false;
            }

            try
            {
                EnsureAddressCanReceiveCart(cart, address.Pincode.Trim());
                return true;
            }
            catch (ArgumentException)
            {
                return false;
            }
        }

        private static Order CreateOrderFromCart(Guid userId, CreateOrderRequestDto dto, Domain.Entities.Cart cart, decimal serverTotalPrice)
        {
            return new Order
            {
                UserId = userId,
                OrderId = Guid.NewGuid(),
                OrderDate = DateTime.UtcNow,
                AddressId = dto.AddressId,
                TotalPrice = serverTotalPrice,
                OrderStatus = OrderStatus.Pending,
                TransactionId = dto.TransactionId,
                PaymentMethod = dto.PaymentMethod.Trim().ToLowerInvariant(),
                OrderItems = cart.CartItems.Select(c => new OrderItem
                {
                    OrderItemId = Guid.NewGuid(),
                    ProductId = c.ProductId,
                    ProductVariantId = c.ProductVariantId,
                    Quantity = c.Quantity,
                    UnitPrice = c.Product.Price - c.Product.Discount,
                    TotalPrice = c.Quantity * (c.Product.Price - c.Product.Discount),
                    SelectedSize = c.SelectedSize,
                    SelectedColor = c.SelectedColor
                }).ToList()
            };
        }

        private void ValidateStockAndDeductQuantities(Domain.Entities.Cart cart)
        {
            foreach (var cartItem in cart.CartItems)
            {
                if (cartItem.ProductVariant.Quantity < cartItem.Quantity)
                {
                    throw new ArgumentException($"Product '{cartItem.Product.ProductName}' is out of stock");
                }

                cartItem.ProductVariant.Quantity -= cartItem.Quantity;
                cartItem.Product.Quantity = cartItem.Product.Variants.Sum(variant =>
                    variant.Id == cartItem.ProductVariantId ? cartItem.ProductVariant.Quantity : variant.Quantity);
                
                cartItem.Product.TotalSold += cartItem.Quantity;
                _productRepo.Update(cartItem.Product);
            }
        }

        private static void EnsureAddressCanReceiveCart(Domain.Entities.Cart cart, string pincode)
        {
            foreach (var cartItem in cart.CartItems)
            {
                var deliverablePincodes = ProductOptionParser.ParsePincodeList(cartItem.Product.DeliverablePincodes);
                if (!deliverablePincodes.Contains(pincode, StringComparer.Ordinal))
                {
                    throw new ArgumentException($"'{cartItem.Product.ProductName}' is not deliverable to pincode {pincode}.");
                }
            }
        }

        private async Task QueueOrderConfirmationEmailAsync(Guid userId, Order order)
        {
            var user = await _userRepo.Query().AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
            {
                return;
            }

            var orderRows = string.Join("", order.OrderItems.Select(item =>
                $"<tr><td style='padding:8px 0'>{System.Net.WebUtility.HtmlEncode(item.SelectedColor)} / {System.Net.WebUtility.HtmlEncode(item.SelectedSize)}</td><td style='padding:8px 0;text-align:center'>{item.Quantity}</td><td style='padding:8px 0;text-align:right'>Rs. {item.TotalPrice:N0}</td></tr>"));

            var body = $"""
                <div style='font-family:Arial,sans-serif;color:#111827'>
                    <h2 style='margin:0 0 12px'>Order confirmed</h2>
                    <p>Your order <strong>{order.OrderId}</strong> has been placed successfully.</p>
                    <table style='width:100%;border-collapse:collapse;margin-top:16px'>
                        <thead>
                            <tr>
                                <th style='text-align:left;border-bottom:1px solid #eee;padding-bottom:8px'>Variant</th>
                                <th style='border-bottom:1px solid #eee;padding-bottom:8px'>Qty</th>
                                <th style='text-align:right;border-bottom:1px solid #eee;padding-bottom:8px'>Amount</th>
                            </tr>
                        </thead>
                        <tbody>{orderRows}</tbody>
                    </table>
                    <p style='font-size:18px;font-weight:700'>Total paid: Rs. {order.TotalPrice:N0}</p>
                    <p>We will email you again when the order status changes.</p>
                </div>
                """;

            await _emailJobQueue.QueueAsync(new EmailJobMessage(user.Email, $"Order confirmed - {order.OrderId}", body));
        }

        private async Task QueueOrderLifecycleEmailAsync(Order order, string subject, string heading, string messageHtml, string? reason = null)
        {
            var user = await _userRepo.Query().AsNoTracking().FirstOrDefaultAsync(u => u.UserId == order.UserId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
            {
                return;
            }

            var reasonHtml = string.IsNullOrWhiteSpace(reason)
                ? string.Empty
                : $"<p><strong>Reason:</strong> {System.Net.WebUtility.HtmlEncode(reason.Trim())}</p>";

            var body = $"""
                <div style='font-family:Arial,sans-serif;color:#111827'>
                    <h2 style='margin:0 0 12px'>{System.Net.WebUtility.HtmlEncode(heading)}</h2>
                    <p>Order <strong>{order.OrderId}</strong></p>
                    <p>{messageHtml}</p>
                    {reasonHtml}
                    <p style='margin-top:16px;color:#4b5563'>You can view the latest order details from your Urbaniq account.</p>
                </div>
                """;

            await _emailJobQueue.QueueAsync(new EmailJobMessage(user.Email, subject, body));
        }

        public async Task<PagedResult<OrderDetailsResponseDto>> GetOrdersByUserIdAsync(Guid userId, int pageNumber = 1, int pageSize = 10)
        {
            var query = _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate);

            var totalCount = await query.CountAsync();
            var orders = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
            var items = orders.Select(MapOrderToDetailsDto).ToList();

            return new PagedResult<OrderDetailsResponseDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<PagedResult<OrderDetailsResponseDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 10)
        {
            var query = _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .OrderByDescending(o => o.OrderDate);

            var totalCount = await query.CountAsync();
            var orders = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
            var items = orders.Select(MapOrderToDetailsDto).ToList();

            return new PagedResult<OrderDetailsResponseDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<OrderDetailsResponseDto> GetOrderByIdAsync(Guid orderId, Guid requestingUserId, bool isAdmin)
        {
            var order = await _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) throw new ArgumentException("Order not found.");
            if (!isAdmin && order.UserId != requestingUserId) throw new UnauthorizedAccessException("You are not authorized to view this order.");

            return MapOrderToDetailsDto(order);
        }

        public async Task<RevenueResponseDto> GetRevenueAsync()
        {
            var revenue = await _orderItemRepo.Query().SumAsync(oi => oi.TotalPrice);
            var itemsSold = await _orderItemRepo.Query().SumAsync(oi => oi.Quantity);

            return new RevenueResponseDto
            {
                TotalRevenue = revenue,
                TotalItemsSold = itemsSold
            };
        }

        public async Task<UpdateOrderStatusResponseDto> CancelOrderAsync(Guid userId, Guid orderId, string reason)
        {
            var order = await _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.ProductVariant)
                .ThenInclude(v => v.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            if (order == null)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order not found" };
            }

            if (order.OrderStatus is OrderStatus.Shipped or OrderStatus.Delivered or OrderStatus.Cancelled or OrderStatus.ReturnRequested or OrderStatus.ReplacementRequested or OrderStatus.Returned or OrderStatus.RefundInitiated or OrderStatus.Refunded)
            {
                return new UpdateOrderStatusResponseDto { Message = "This order can no longer be cancelled" };
            }

            foreach (var item in order.OrderItems)
            {
                item.ProductVariant.Quantity += item.Quantity;
                item.Product.Quantity += item.Quantity;
                
                if (item.Product.TotalSold >= item.Quantity)
                {
                    item.Product.TotalSold -= item.Quantity;
                }

                _productRepo.Update(item.Product);
            }

            order.OrderStatus = OrderStatus.Cancelled;
            order.CancellationReason = reason.Trim();
            order.CancelledAtUtc = DateTime.UtcNow;
            _orderRepo.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await QueueOrderLifecycleEmailAsync(
                order,
                $"Order cancelled - {order.OrderId}",
                "Order cancelled",
                "Your cancellation request has been completed.",
                order.CancellationReason);

            return new UpdateOrderStatusResponseDto
            {
                OrderStatus = order.OrderStatus.ToString(),
                Message = "Order cancelled successfully"
            };
        }

        public async Task<UpdateOrderStatusResponseDto> RequestReturnAsync(Guid userId, Guid orderId, string reason)
        {
            var order = await _orderRepo.Query()
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            if (order == null)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order not found" };
            }

            if (order.OrderStatus != OrderStatus.Delivered)
            {
                return new UpdateOrderStatusResponseDto { Message = "Only delivered orders can be returned" };
            }

            order.OrderStatus = OrderStatus.ReturnRequested;
            order.ReturnReason = reason.Trim();
            order.ReturnRequestedAtUtc = DateTime.UtcNow;
            _orderRepo.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await QueueOrderLifecycleEmailAsync(
                order,
                $"Return requested - {order.OrderId}",
                "Return request received",
                "Your return request has been submitted. Our team will review it and update you shortly.",
                order.ReturnReason);

            return new UpdateOrderStatusResponseDto
            {
                OrderStatus = order.OrderStatus.ToString(),
                Message = "Return request submitted"
            };
        }

        public async Task<UpdateOrderStatusResponseDto> RequestReplacementAsync(Guid userId, Guid orderId, string reason)
        {
            var order = await _orderRepo.Query()
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            if (order == null)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order not found" };
            }

            if (order.OrderStatus != OrderStatus.Delivered)
            {
                return new UpdateOrderStatusResponseDto { Message = "Only delivered orders can be replaced" };
            }

            order.OrderStatus = OrderStatus.ReplacementRequested;
            order.ReplacementReason = reason.Trim();
            order.ReplacementRequestedAtUtc = DateTime.UtcNow;
            _orderRepo.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await QueueOrderLifecycleEmailAsync(
                order,
                $"Replacement requested - {order.OrderId}",
                "Replacement request received",
                "Your replacement request has been submitted. Our team will review it and update you shortly.",
                order.ReplacementReason);

            return new UpdateOrderStatusResponseDto
            {
                OrderStatus = order.OrderStatus.ToString(),
                Message = "Replacement request submitted"
            };
        }

        private OrderDetailsResponseDto MapOrderToDetailsDto(Order order)
        {
            return new OrderDetailsResponseDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                TotalPrice = order.TotalPrice,
                OrderStatus = order.OrderStatus.ToString(),
                TransactionId = order.TransactionId,
                PaymentMethod = order.PaymentMethod,
                CancellationReason = order.CancellationReason,
                ReturnReason = order.ReturnReason,
                ReplacementReason = order.ReplacementReason,
                CancelledAtUtc = order.CancelledAtUtc,
                ReturnRequestedAtUtc = order.ReturnRequestedAtUtc,
                ReplacementRequestedAtUtc = order.ReplacementRequestedAtUtc,
                RefundedAtUtc = order.RefundedAtUtc,
                Address = _mapper.Map<AddressResponseDto>(order.Address),
                OrderItems = order.OrderItems.Select(item => new OrderItemResponseDto
                {
                    OrderItemId = item.OrderItemId,
                    ProductId = item.ProductId,
                    ProductName = item.Product.ProductName,
                    ImageUrl = item.Product.Image,
                    Price = item.UnitPrice,
                    Quantity = item.Quantity,
                    TotalAmount = item.TotalPrice,
                    Size = item.SelectedSize,
                    Color = item.SelectedColor
                }).ToList()
            };
        }
    }
}
