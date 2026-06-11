namespace Ecommerce.Application.DTOs.Payment
{
    public class PaymentVerificationResponseDto
    {
        public string Status { get; set; } = null!;
        public bool IsSuccessful { get; set; }
    }
}
