namespace Ecommerce.Application.DTOs.Wishlist
{
    public class WishListItemResponseDto
    {
        public Guid WishListId { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Image { get; set; } = string.Empty;
    }
}
