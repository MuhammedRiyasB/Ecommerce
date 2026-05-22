namespace Ecommerce.Domain.Entities
{
    public class WishList
    {
        public Guid WishListId { get; set; }
        public Guid UserId { get; set; }
        public Guid ProductId { get; set; }

        // Navigation Properties
        public User User { get; set; } = null!;
        public Product Product { get; set; } = null!;
    }
}
