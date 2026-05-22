namespace Ecommerce.Application.DTOs.Identity
{
    public class ResetPasswordRequestDto
    {
        public string Email { get; set; } = string.Empty;
        
        /// <summary>The 6-digit verification code received via email.</summary>
        public string Code { get; set; } = string.Empty;
        
        public string NewPassword { get; set; } = string.Empty;
    }
}
