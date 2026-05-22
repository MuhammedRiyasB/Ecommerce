namespace Ecommerce.Application.DTOs.Orders
{
    public class UpdateOrderStatusResponseDto
    {
        public string? OrderStatus { get; set; }
        public string Message { get; set; } = null!;
    }
}
