namespace Ecommerce.Application.DTOs.Catalog
{
    /// <summary>
    /// Lightweight product card payload for storefront homepage rails.
    /// Keep this DTO small so the homepage can load many product cards quickly.
    /// </summary>
    public class HomeProductCardDto
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public string Image { get; set; } = null!;
        public string? Color { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string? SubCategoryName { get; set; }
    }
}
