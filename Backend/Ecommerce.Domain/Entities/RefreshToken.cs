namespace Ecommerce.Domain.Entities
{
    /// <summary>
    /// Represents a refresh token used for JWT token rotation.
    /// Tokens sharing the same TokenFamily form a rotation chain;
    /// reuse of a revoked token triggers family-wide revocation (theft detection).
    /// </summary>
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Token { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRevoked { get; set; } = false;
        public Guid TokenFamily { get; set; }

        // Navigation Properties
        public User User { get; set; } = null!;
    }
}
