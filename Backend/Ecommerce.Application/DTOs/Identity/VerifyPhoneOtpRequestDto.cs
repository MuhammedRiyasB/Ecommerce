namespace Ecommerce.Application.DTOs.Identity
{
    public class VerifyPhoneOtpRequestDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
    }
}
