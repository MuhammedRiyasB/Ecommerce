namespace Ecommerce.Application.DTOs.Payment
{
    public class PaymentIntentResponseDto
    {
        public string ClientSecret { get; set; } = null!;
        public string PaymentIntentId { get; set; } = null!;
    }
}
