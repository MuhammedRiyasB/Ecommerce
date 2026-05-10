using Ecommerce.Application.DTOs.Address;

namespace Ecommerce.Application.DTOs.Orders
{
    public class OrderDetailsResponseDto
    {
        public Guid OrderId { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string OrderStatus { get; set; } = null!;
        public string TransactionId { get; set; } = null!;
        public AddressResponseDto Address { get; set; } = null!;
        public List<OrderItemResponseDto> OrderItems { get; set; } = new();
    }
}
