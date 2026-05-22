using AutoMapper;
using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Application.Interfaces.Email;
using Ecommerce.Application.Interfaces.Identity;
using Ecommerce.Application.Common.Settings;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;
using Ecommerce.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Ecommerce.Application.Services.Identity
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<RefreshToken> _refreshTokenRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly JwtSettings _jwtSettings;
        private readonly IEmailSender _emailSender;
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IRepository<User> userRepo,
            IRepository<RefreshToken> refreshTokenRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IOptions<JwtSettings> jwtSettings,
            IEmailSender emailSender,
            IOptions<EmailSettings> emailSettings,
            ILogger<AuthService> logger)
        {
            _userRepo = userRepo;
            _refreshTokenRepo = refreshTokenRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _jwtSettings = jwtSettings.Value;
            _emailSender = emailSender;
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task<UserResponseDto> RegisterAsync(RegisterRequestDto registerDto, string role = "User")
        {
            var emailToCheck = registerDto.Email.ToLower().Trim();

            if (await _userRepo.Query().AnyAsync(u => u.Email.ToLower().Trim() == emailToCheck))
            {
                _logger.LogInformation("Registration rejected because the email already exists.");
                throw new ArgumentException("Email already exists");
            }

            if (!Enum.TryParse<UserRole>(role, ignoreCase: true, out var parsedRole))
                throw new ArgumentException($"Invalid role: {role}");

            var user = _mapper.Map<User>(registerDto);
            user.Email = emailToCheck; // Save as normalized lowercase
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
            user.UserId = Guid.NewGuid();
            user.Role = parsedRole;

            await _userRepo.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();
            return _mapper.Map<UserResponseDto>(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginDto)
        {
            var user = await _userRepo.Query().FirstOrDefaultAsync(u => u.Email == loginDto.Email.ToLower());
            if (user == null)
                throw new ArgumentException("Invalid email or password");

            if (user.IsBlocked)
                throw new UnauthorizedAccessException("Your account has been blocked. Please contact support.");

            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                throw new ArgumentException("Invalid email or password");

            return await GenerateAuthResponseAsync(user);
        }

        // ─────────────────────────────────────────────────────────────
        // Forgot Password – generates a 6-digit OTP and emails it
        // ─────────────────────────────────────────────────────────────
        public async Task ForgotPasswordAsync(ForgotPasswordRequestDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var user = await _userRepo.Query().FirstOrDefaultAsync(u => u.Email == email);

            // Always return success to prevent email enumeration attacks
            if (user == null)
            {
                _logger.LogWarning("[Auth] Password reset requested for non-existent email: {Email}", email);
                return;
            }

            // Generate a 6-digit numeric code
            var otpCode = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

            // Store the SHA-256 hash of the 6-digit code
            var codeHash = ComputeSha256Hash(otpCode);
            user.PasswordResetTokenHash = codeHash;
            user.PasswordResetTokenExpiresUtc = DateTime.UtcNow.AddMinutes(15); // 15 mins for OTP

            _userRepo.Update(user);
            await _unitOfWork.SaveChangesAsync();

            // Build a professional HTML email body with the 6-digit code
            var htmlBody = BuildOtpEmailHtml(user.Name, otpCode);

            await _emailSender.SendAsync(email, "Reset Your Urbaniq Password", htmlBody);
            _logger.LogInformation("[Auth] 6-digit OTP sent to {Email}", email);
        }

        // ─────────────────────────────────────────────────────────────
        // Verify OTP – checks if the code is correct without resetting yet
        // ─────────────────────────────────────────────────────────────
        public async Task<bool> VerifyOtpAsync(VerifyOtpRequestDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var user = await _userRepo.Query().FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || user.PasswordResetTokenHash == null) return false;

            var incomingHash = ComputeSha256Hash(dto.Code);
            var isValid = user.PasswordResetTokenHash == incomingHash && 
                          user.PasswordResetTokenExpiresUtc > DateTime.UtcNow;

            return isValid;
        }

        // ─────────────────────────────────────────────────────────────
        // Reset Password – validates OTP code and updates password
        // ─────────────────────────────────────────────────────────────
        public async Task ResetPasswordAsync(ResetPasswordRequestDto dto)
        {
            var email = dto.Email.ToLower().Trim();
            var user = await _userRepo.Query().FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                throw new ArgumentException("Invalid or expired verification code.");

            // Verify the code hash matches
            var incomingHash = ComputeSha256Hash(dto.Code);
            if (user.PasswordResetTokenHash == null || user.PasswordResetTokenHash != incomingHash)
                throw new ArgumentException("Invalid or expired verification code.");

            // Verify the code hasn't expired
            if (user.PasswordResetTokenExpiresUtc == null || user.PasswordResetTokenExpiresUtc < DateTime.UtcNow)
                throw new ArgumentException("Verification code has expired. Please request a new one.");

            // Update the password with BCrypt hash
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            // Clear the OTP fields so it can't be reused
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresUtc = null;

            _userRepo.Update(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("[Auth] Password successfully reset for {Email}", email);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _refreshTokenRepo.Query()
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (storedToken == null)
                throw new UnauthorizedAccessException("Invalid refresh token");

            // Reuse detection: if token was already revoked, an attacker is replaying a stolen token
            if (storedToken.IsRevoked)
            {
                await RevokeTokenFamilyAsync(storedToken.TokenFamily);
                throw new UnauthorizedAccessException(
                    "Refresh token reuse detected. All sessions for this token family have been revoked for security.");
            }

            if (storedToken.ExpiresAt < DateTime.UtcNow)
                throw new UnauthorizedAccessException("Refresh token has expired");

            storedToken.IsRevoked = true;
            _refreshTokenRepo.Update(storedToken);
            await _unitOfWork.SaveChangesAsync();

            return await GenerateAuthResponseAsync(storedToken.User, storedToken.TokenFamily);
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _refreshTokenRepo.Query()
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

            if (storedToken != null)
            {
                await RevokeTokenFamilyAsync(storedToken.TokenFamily);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────

        /// <summary>Computes a SHA-256 hash of the given input string.</summary>
        private static string ComputeSha256Hash(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }

        /// <summary>Builds a professional HTML email for the 6-digit verification code.</summary>
        private static string BuildOtpEmailHtml(string userName, string otpCode)
        {
            return $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'>
                    <h1 style='color: white; margin: 0; font-size: 28px;'>Urbaniq</h1>
                </div>
                <div style='background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;'>
                    <h2 style='color: #1f2937; margin-top: 0;'>Verify Your Identity</h2>
                    <p style='color: #4b5563; font-size: 16px; line-height: 1.6;'>
                        Hi <strong>{userName}</strong>,
                    </p>
                    <p style='color: #4b5563; font-size: 16px; line-height: 1.6;'>
                        For your security, we have sent a verification code to your email. Please use the code below to complete your password reset. 
                        This code will expire in <strong>15 minutes</strong>.
                    </p>
                    <div style='text-align: center; margin: 40px 0;'>
                        <div style='background: #f3f4f6; border-radius: 12px; padding: 20px; display: inline-block; border: 2px dashed #667eea;'>
                            <span style='font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1f2937;'>{otpCode}</span>
                        </div>
                    </div>
                    <p style='color: #9ca3af; font-size: 14px; line-height: 1.6;'>
                        If you didn't request a password reset, you can safely ignore this email. 
                        Your password will remain unchanged.
                    </p>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;' />
                    <p style='color: #9ca3af; font-size: 12px; text-align: center;'>
                        &copy; {DateTime.UtcNow.Year} Urbaniq. All rights reserved.
                    </p>
                </div>
            </div>";
        }

        private async Task RevokeTokenFamilyAsync(Guid tokenFamily)
        {
            var familyTokens = await _refreshTokenRepo.Query()
                .Where(rt => rt.TokenFamily == tokenFamily && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in familyTokens)
            {
                token.IsRevoked = true;
                _refreshTokenRepo.Update(token);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, Guid? existingFamily = null)
        {
            var tokenFamily = existingFamily ?? Guid.NewGuid();
            var accessToken = CreateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.UserId, tokenFamily);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                User = _mapper.Map<UserResponseDto>(user)
            };
        }

        private string CreateAccessToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Role, user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                signingCredentials: credentials,
                expires: DateTime.UtcNow.AddMinutes(30)
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<string> CreateRefreshTokenAsync(Guid userId, Guid tokenFamily)
        {
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var tokenString = Convert.ToBase64String(tokenBytes);

            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = tokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                IsRevoked = false,
                TokenFamily = tokenFamily
            };

            await _refreshTokenRepo.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync();
            return tokenString;
        }
    }
}
