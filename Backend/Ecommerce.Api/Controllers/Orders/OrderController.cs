using Ecommerce.Application.DTOs.Orders;
using Ecommerce.Application.Interfaces.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Orders
{
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiController]
    [ApiVersion("1.0")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        public OrderController(IOrderService orderService) => _orderService = orderService;

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var userId))
                throw new UnauthorizedAccessException("User id not found in token");
            return userId;
        }

        private bool IsAdmin() => User.IsInRole("Admin");

        [HttpPost("place-order")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequestDto dto)
        {
            var result = await _orderService.CreateOrderAsync(GetUserId(), dto);
            return result ? Ok(new { message = "Order placed successfully" }) : BadRequest(new { message = "Failed to place order" });
        }

        [HttpGet("validate-delivery/{addressId:guid}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> ValidateDelivery(Guid addressId)
        {
            var canDeliver = await _orderService.CanDeliverCartToAddressAsync(GetUserId(), addressId);
            return Ok(new { canDeliver });
        }

        [HttpGet("user-orders")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetUserOrders([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
            => Ok(await _orderService.GetOrdersByUserIdAsync(GetUserId(), pageNumber, pageSize));

        [HttpGet("all-orders")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null)
            => Ok(await _orderService.GetAllOrdersAsync(pageNumber, pageSize, status));

        [HttpGet("{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetOrderById(Guid orderId)
            => Ok(await _orderService.GetOrderByIdAsync(orderId, GetUserId(), IsAdmin()));

        [HttpPut("change-status/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ChangeOrderStatus(Guid orderId, [FromBody] ChangeOrderStatusRequestDto dto)
        {
            var result = await _orderService.ChangeOrderStatusAsync(orderId, dto.Status);
            return result.Message == "invalidstatus"
                ? BadRequest(new { message = "Invalid order status provided." })
                : Ok(result);
        }

        [HttpPost("{orderId:guid}/cancel")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CancelOrder(Guid orderId, [FromBody] OrderActionRequestDto dto)
        {
            var result = await _orderService.CancelOrderAsync(GetUserId(), orderId, dto.Reason);
            return result.Message.Contains("successfully", StringComparison.OrdinalIgnoreCase)
                ? Ok(result)
                : BadRequest(result);
        }



        [HttpGet("revenue")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetTotalRevenue() => Ok(await _orderService.GetRevenueAsync());
    }
}
