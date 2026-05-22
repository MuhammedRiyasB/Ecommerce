using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Application.Interfaces.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Identity
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService) => _authService = authService;

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid registration data." });
            var user = await _authService.RegisterAsync(dto);
            return Ok(new { message = "Registration successful", data = user });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid login data." });
            var auth = await _authService.LoginAsync(dto);
            return Ok(auth);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Refresh token is required." });
            var auth = await _authService.RefreshTokenAsync(dto.RefreshToken);
            return Ok(auth);
        }

        [HttpPost("revoke-token")]
        [Authorize]
        public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Refresh token is required." });
            await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
            return Ok(new { message = "Token revoked successfully." });
        }

        /// <summary>
        /// Sends a 6-digit verification code if the account exists.
        /// Always returns 200 to prevent email enumeration.
        /// </summary>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Email is required." });
            await _authService.ForgotPasswordAsync(dto);
            return Ok(new { message = "If an account exists with this email, a 6-digit verification code has been sent." });
        }

        /// <summary>
        /// Verifies the 6-digit OTP code before proceeding to password reset.
        /// </summary>
        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid data." });
            var isValid = await _authService.VerifyOtpAsync(dto);
            if (!isValid)
                return BadRequest(new { message = "Invalid or expired verification code." });

            return Ok(new { message = "Code verified successfully." });
        }

        /// <summary>
        /// Validates the 6-digit code and updates the user's password.
        /// </summary>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid reset data." });
            
            try
            {
                await _authService.ResetPasswordAsync(dto);
                return Ok(new { message = "Password has been reset successfully. You can now log in with your new password." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
