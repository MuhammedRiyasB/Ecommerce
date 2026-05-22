namespace Ecommerce.Application.DTOs.Orders
{
    public class CreateOrderRequestDto
    {
        public Guid AddressId { get; set; }
        public string TransactionId { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
    }
}
