namespace Ecommerce.Application.DTOs.Cart
{
    public class CartResponseDto
    {
        public Guid CartId { get; set; }
        public decimal TotalPrice { get; set; }
        public int TotalCount { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
    }
}
