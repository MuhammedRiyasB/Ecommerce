namespace Ecommerce.Application.DTOs.Cart
{
    public class CartItemResponseDto
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
        public string Image { get; set; } = null!;
    }
}
