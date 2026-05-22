using Ecommerce.Application.DTOs.Orders;
using Ecommerce.Domain.Common;

namespace Ecommerce.Application.Interfaces.Orders
{
    /// <summary>
    /// Manages order lifecycle — creation, retrieval, status updates, and revenue reporting.
    /// </summary>
    public interface IOrderService
    {
        Task<bool> CreateOrderAsync(Guid userId, CreateOrderRequestDto createOrderDto);
        Task<PagedResult<OrderDetailsResponseDto>> GetOrdersByUserIdAsync(Guid userId, int pageNumber = 1, int pageSize = 10);
        Task<PagedResult<OrderDetailsResponseDto>> GetAllOrdersAsync(int pageNumber = 1, int pageSize = 10);
        Task<OrderDetailsResponseDto> GetOrderByIdAsync(Guid orderId, Guid requestingUserId, bool isAdmin);
        Task<UpdateOrderStatusResponseDto> ChangeOrderStatusAsync(Guid orderId, string status);
        Task<UpdateOrderStatusResponseDto> CancelOrderAsync(Guid userId, Guid orderId, string reason);
        Task<UpdateOrderStatusResponseDto> RequestReturnAsync(Guid userId, Guid orderId, string reason);
        Task<UpdateOrderStatusResponseDto> RequestReplacementAsync(Guid userId, Guid orderId, string reason);
        Task<RevenueResponseDto> GetRevenueAsync();
        Task<bool> CanDeliverCartToAddressAsync(Guid userId, Guid addressId);
    }
}
