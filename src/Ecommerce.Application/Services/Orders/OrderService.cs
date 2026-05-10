using AutoMapper;
using Ecommerce.Application.DTOs.Address;
using Ecommerce.Application.DTOs.Orders;
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
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public OrderService(
            IRepository<Order> orderRepo,
            IRepository<Domain.Entities.Cart> cartRepo,
            IRepository<CartItem> cartItemRepo,
            IRepository<Product> productRepo,
            IRepository<Address> addressRepo,
            IRepository<OrderItem> orderItemRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _orderRepo = orderRepo;
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _productRepo = productRepo;
            _addressRepo = addressRepo;
            _orderItemRepo = orderItemRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<UpdateOrderStatusResponseDto> ChangeOrderStatusAsync(Guid orderId, string status)
        {
            if (!Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var parsedStatus))
                return new UpdateOrderStatusResponseDto { Message = "invalidstatus" };

            var order = await _orderRepo.Query().FirstOrDefaultAsync(o => o.OrderId == orderId);
            if (order == null)
                return new UpdateOrderStatusResponseDto { Message = "Order not found" };

            order.OrderStatus = parsedStatus;
            _orderRepo.Update(order);
            await _unitOfWork.SaveChangesAsync();

            return new UpdateOrderStatusResponseDto { OrderStatus = parsedStatus.ToString(), Message = "Order status updated successfully" };
        }

        public async Task<bool> CreateOrderAsync(Guid userId, CreateOrderRequestDto dto)
        {
            // Idempotency check — prevent duplicate orders with same TransactionId
            var existingOrder = await _orderRepo.Query()
                .AnyAsync(o => o.TransactionId == dto.TransactionId);
            if (existingOrder)
                throw new ArgumentException("An order with this transaction ID already exists.");

            var address = await _addressRepo.Query()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.AddressId == dto.AddressId && s.UserId == userId && !s.IsDeleted);
            if (address == null) throw new ArgumentException("Cannot find the address");

            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null || cart.CartItems == null || !cart.CartItems.Any())
                throw new ArgumentException("Your cart is empty");

            // Calculate server-side total using decimal pricing
            var serverTotalPrice = cart.CartItems.Sum(c => c.Quantity * c.Product.Price);

            var order = CreateOrderFromCart(userId, dto, cart, serverTotalPrice);

            ValidateStockAndDeductQuantities(cart);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _orderRepo.AddAsync(order);
                _cartItemRepo.RemoveRange(cart.CartItems);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitAsync();
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
            return true;
        }

        /// <summary>
        /// Builds an Order entity from the user's cart contents.
        /// Captures current product prices as UnitPrice for historical accuracy.
        /// </summary>
        private static Order CreateOrderFromCart(Guid userId, CreateOrderRequestDto dto, Domain.Entities.Cart cart, decimal serverTotalPrice)
        {
            return new Order
            {
                UserId = userId, OrderId = Guid.NewGuid(), OrderDate = DateTime.UtcNow,
                AddressId = dto.AddressId, TotalPrice = serverTotalPrice,
                OrderStatus = OrderStatus.Pending, TransactionId = dto.TransactionId,
                OrderItems = cart.CartItems.Select(c => new OrderItem
                {
                    OrderItemId = Guid.NewGuid(), ProductId = c.ProductId,
                    Quantity = c.Quantity, UnitPrice = c.Product.Price,
                    TotalPrice = c.Quantity * c.Product.Price
                }).ToList()
            };
        }

        private void ValidateStockAndDeductQuantities(Domain.Entities.Cart cart)
        {
            foreach (var cartItem in cart.CartItems)
            {
                if (cartItem.Product.Quantity < cartItem.Quantity)
                    throw new ArgumentException($"Product '{cartItem.Product.ProductName}' is out of stock");
                cartItem.Product.Quantity -= cartItem.Quantity;
                _productRepo.Update(cartItem.Product);
            }
        }

        public async Task<PagedResult<OrderDetailsResponseDto>> GetOrdersByUserIdAsync(Guid userId, int pageNumber = 1, int pageSize = 10)
        {
            var query = _orderRepo.Query()
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Address)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate);

            var totalCount = await query.CountAsync();

            var orders = await query
                .Skip((pageNumber - 1) * pageSize).Take(pageSize)
                .ToListAsync();

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

            if (!isAdmin && order.UserId != requestingUserId)
                throw new UnauthorizedAccessException("You are not authorized to view this order.");

            return MapOrderToDetailsDto(order);
        }

        public async Task<RevenueResponseDto> GetRevenueAsync()
        {
            // Aggregate revenue using decimal — no lossy int casts
            var revenue = await _orderItemRepo.Query().SumAsync(oi => oi.TotalPrice);
            var itemsSold = await _orderItemRepo.Query().SumAsync(oi => oi.Quantity);

            return new RevenueResponseDto
            {
                TotalRevenue = revenue,
                TotalItemsSold = itemsSold
            };
        }

        /// <summary>
        /// Maps an Order entity to its response DTO with decimal pricing.
        /// </summary>
        private OrderDetailsResponseDto MapOrderToDetailsDto(Order o)
        {
            return new OrderDetailsResponseDto
            {
                OrderId = o.OrderId, OrderDate = o.OrderDate, TotalPrice = o.TotalPrice,
                OrderStatus = o.OrderStatus.ToString(), TransactionId = o.TransactionId,
                Address = _mapper.Map<AddressResponseDto>(o.Address),
                OrderItems = o.OrderItems.Select(item => new OrderItemResponseDto
                {
                    OrderItemId = item.OrderItemId, ProductId = item.ProductId,
                    ProductName = item.Product.ProductName, ImageUrl = item.Product.Image,
                    Price = item.UnitPrice, Quantity = item.Quantity,
                    TotalAmount = item.TotalPrice
                }).ToList()
            };
        }
    }
}
