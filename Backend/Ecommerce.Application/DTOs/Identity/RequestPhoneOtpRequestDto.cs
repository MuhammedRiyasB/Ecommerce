namespace Ecommerce.Application.DTOs.Identity
{
    public class RequestPhoneOtpRequestDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
    }
}
