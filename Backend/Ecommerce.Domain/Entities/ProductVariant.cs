namespace Ecommerce.Domain.Entities
{
    public class ProductVariant
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string SKU { get; set; } = null!;
        public string Size { get; set; } = null!;
        public string Color { get; set; } = null!;
        public int Quantity { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAtUtc { get; set; }

        public Product Product { get; set; } = null!;
        public List<CartItem> CartItems { get; set; } = new();
        public List<OrderItem> OrderItems { get; set; } = new();
    }
}
