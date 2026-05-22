namespace Ecommerce.Application.DTOs.Identity
{
    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public UserResponseDto User { get; set; } = null!;
    }
}
