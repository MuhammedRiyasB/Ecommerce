namespace Ecommerce.Application.DTOs.Catalog
{
    /// <summary>
    /// Response DTO for product data in the D2C men's clothing platform.
    /// Includes clothing-specific attributes and category information.
    /// </summary>
    public class ProductResponseDto
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public string Description { get; set; } = null!;
        public string Image { get; set; } = null!;
        public string Size { get; set; } = null!;
        public string Color { get; set; } = null!;
        public string? Material { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
    }
}
