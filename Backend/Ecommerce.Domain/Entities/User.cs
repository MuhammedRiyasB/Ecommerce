using Ecommerce.Domain.Enums;

namespace Ecommerce.Domain.Entities
{
    public class User
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public UserRole Role { get; set; } = UserRole.User;
        public bool IsBlocked { get; set; } = false;

        // --- Password Reset ---
        /// <summary>SHA-256 hash of the one-time reset token. Never store the raw token.</summary>
        public string? PasswordResetTokenHash { get; set; }
        /// <summary>UTC expiry for the reset token (1 hour window).</summary>
        public DateTime? PasswordResetTokenExpiresUtc { get; set; }

        // Navigation Properties
        public List<Order> Orders { get; set; } = new();
        public Cart? Cart { get; set; }
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
    }
}
