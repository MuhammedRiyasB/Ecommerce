namespace Ecommerce.Application.DTOs.Identity
{
    /// <summary>
    /// Request payload for the "Forgot Password" endpoint.
    /// Only the email address is needed to trigger a reset link.
    /// </summary>
    public class ForgotPasswordRequestDto
    {
        public string Email { get; set; } = default!;
    }
}
