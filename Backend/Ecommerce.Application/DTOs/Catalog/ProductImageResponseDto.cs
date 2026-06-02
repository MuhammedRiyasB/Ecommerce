namespace Ecommerce.Application.DTOs.Catalog
{
    public class ProductImageResponseDto
    {
        public string ImageUrl { get; set; } = null!;
        public string? Color { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsPrimary { get; set; }
    }
}
