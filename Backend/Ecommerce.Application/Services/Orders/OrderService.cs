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

            var order = await _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order not found" };
            }

            // Unidirectional flow enforcement
            if (order.OrderStatus == OrderStatus.Delivered || order.OrderStatus == OrderStatus.Cancelled)
            {
                return new UpdateOrderStatusResponseDto { Message = "Cannot update status of a delivered or cancelled order" };
            }
            if (order.OrderStatus == OrderStatus.Processing && parsedStatus != OrderStatus.Shipped)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order in Processing can only be changed to Shipped" };
            }
            if (order.OrderStatus == OrderStatus.Shipped && parsedStatus != OrderStatus.Delivered)
            {
                return new UpdateOrderStatusResponseDto { Message = "Order in Shipped can only be changed to Delivered" };
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

            var populatedOrder = await _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.OrderId == order.OrderId);

            if (populatedOrder == null) return;

            var body = GenerateRichEmailHtml(populatedOrder, "Order Confirmed", $"Your order <strong>{populatedOrder.OrderId}</strong> has been placed successfully. Thank you for shopping with us!");

            await _emailJobQueue.QueueAsync(new EmailJobMessage(user.Email, $"Order confirmed - {populatedOrder.OrderId}", body));
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
                : $"<p style='color:#ef4444;font-size:14px;margin-top:10px;'><strong>Reason:</strong> {System.Net.WebUtility.HtmlEncode(reason.Trim())}</p>";

            var body = GenerateRichEmailHtml(order, heading, messageHtml, reasonHtml);

            await _emailJobQueue.QueueAsync(new EmailJobMessage(user.Email, subject, body));
        }

        private static string GenerateRichEmailHtml(Order order, string heading, string messageHtml, string? reasonHtml = null)
        {
            var itemsHtml = string.Join("", order.OrderItems.Select(item => $@"
                <tr>
                    <td style='padding:16px 0;border-bottom:1px solid #e5e7eb;'>
                        <table style='width:100%;border-collapse:collapse;'>
                            <tr>
                                <td style='width:80px;vertical-align:top;padding-right:16px;'>
                                    <img src='{item.Product?.Image ?? ""}' alt='Product Image' style='width:80px;height:100px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;' />
                                </td>
                                <td style='vertical-align:top;'>
                                    <p style='margin:0 0 4px;font-weight:600;color:#111827;font-size:16px;'>{System.Net.WebUtility.HtmlEncode(item.Product?.ProductName ?? "Product")}</p>
                                    <p style='margin:0 0 4px;color:#6b7280;font-size:14px;'>Color: {System.Net.WebUtility.HtmlEncode(item.SelectedColor)} | Size: {System.Net.WebUtility.HtmlEncode(item.SelectedSize)}</p>
                                    <p style='margin:0;color:#374151;font-size:14px;'>Qty: {item.Quantity} × Rs. {item.UnitPrice:N0}</p>
                                </td>
                                <td style='vertical-align:top;text-align:right;'>
                                    <p style='margin:0;font-weight:700;color:#111827;font-size:16px;'>Rs. {item.TotalPrice:N0}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>"));

            var address = order.Address;
            var addressHtml = address != null ? $@"
                <div style='background-color:#f9fafb;padding:16px;border-radius:6px;margin-top:24px;border:1px solid #e5e7eb;'>
                    <h3 style='margin:0 0 12px;font-size:16px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;'>Delivery Address</h3>
                    <p style='margin:0 0 4px;font-weight:600;color:#374151;'>{System.Net.WebUtility.HtmlEncode(address.FullName)}</p>
                    <p style='margin:0 0 4px;color:#4b5563;font-size:14px;'>{System.Net.WebUtility.HtmlEncode(address.HouseName)}, {System.Net.WebUtility.HtmlEncode(address.Place)}</p>
                    <p style='margin:0 0 4px;color:#4b5563;font-size:14px;'>{System.Net.WebUtility.HtmlEncode(address.PostOffice)} - {System.Net.WebUtility.HtmlEncode(address.Pincode)}</p>
                    <p style='margin:0;color:#4b5563;font-size:14px;'>Phone: {System.Net.WebUtility.HtmlEncode(address.PhoneNumber)}</p>
                </div>" : "";

            var paymentMethodDisplay = string.Equals(order.PaymentMethod, "cod", StringComparison.OrdinalIgnoreCase) ? "Cash on Delivery" : "Online Payment (Card)";

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        @media only screen and (max-width: 600px) {{
            .container {{ width: 100% !important; padding: 10px !important; }}
            .content {{ padding: 20px !important; }}
        }}
    </style>
</head>
<body style='margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,""Segoe UI"",Roboto,Helvetica,Arial,sans-serif;'>
    <div style='width:100%;background-color:#f3f4f6;padding:40px 0;'>
        <div class='container' style='max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);'>
            
            <div style='background-color:#111827;padding:24px;text-align:center;'>
                <h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:4px;text-transform:uppercase;'>URBANIQ</h1>
            </div>

            <div class='content' style='padding:32px;'>
                <h2 style='margin:0 0 16px;color:#111827;font-size:24px;font-weight:700;'>{System.Net.WebUtility.HtmlEncode(heading)}</h2>
                <div style='color:#374151;font-size:16px;line-height:1.5;margin-bottom:24px;'>
                    <p style='margin:0 0 8px;'>{messageHtml}</p>
                    {reasonHtml}
                </div>

                <div style='background-color:#f9fafb;padding:16px;border-radius:6px;margin-bottom:24px;border:1px solid #e5e7eb;'>
                    <p style='margin:0 0 8px;color:#4b5563;font-size:14px;'>Order ID: <strong style='color:#111827;'>{order.OrderId}</strong></p>
                    <p style='margin:0 0 8px;color:#4b5563;font-size:14px;'>Order Date: <strong style='color:#111827;'>{order.OrderDate:dd MMM yyyy, hh:mm tt}</strong></p>
                    <p style='margin:0;color:#4b5563;font-size:14px;'>Payment Method: <strong style='color:#111827;'>{paymentMethodDisplay}</strong></p>
                </div>

                <h3 style='margin:0 0 16px;font-size:18px;color:#111827;border-bottom:2px solid #111827;padding-bottom:8px;'>Order Details</h3>
                <table style='width:100%;border-collapse:collapse;margin-bottom:24px;'>
                    <tbody>
                        {itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style='padding:16px 0 0;text-align:right;'>
                                <p style='margin:0;font-size:16px;color:#4b5563;'>Total Amount</p>
                                <p style='margin:4px 0 0;font-size:24px;font-weight:800;color:#111827;'>Rs. {order.TotalPrice:N0}</p>
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {addressHtml}
                
                <div style='margin-top:32px;text-align:center;'>
                    <a href='https://urbaniq.ddnsking.com/profile/orders' style='display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:4px;'>Track Your Order</a>
                </div>
            </div>

            <div style='background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;'>
                <p style='margin:0 0 8px;color:#6b7280;font-size:13px;'>If you have any questions, please reply to this email or visit our help center.</p>
                <p style='margin:0;color:#9ca3af;font-size:12px;'>&copy; {DateTime.UtcNow.Year} Urbaniq. All rights reserved.</p>
            </div>
            
        </div>
    </div>
</body>
</html>";
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

        public async Task<PagedResult<OrderDetailsResponseDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 10, string? status = null)
        {
            var query = _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .Include(o => o.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.OrderStatus == orderStatus);
            }

            query = query.OrderByDescending(o => o.OrderDate);

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
                .Include(o => o.Address)
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



        private OrderDetailsResponseDto MapOrderToDetailsDto(Order order)
        {
            return new OrderDetailsResponseDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                TotalPrice = order.TotalPrice,
                OrderStatus = order.OrderStatus.ToString(),
                TransactionId = order.TransactionId,
                UserEmail = order.User?.Email,
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
