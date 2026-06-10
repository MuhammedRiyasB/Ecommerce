namespace Ecommerce.Application.DTOs.Identity
{
    public class UserResponseDto
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = null!;
        public bool IsBlocked { get; set; }
        public bool IsPhoneNumberVerified { get; set; }
        public bool IsEmailVerified { get; set; }
    }
}
