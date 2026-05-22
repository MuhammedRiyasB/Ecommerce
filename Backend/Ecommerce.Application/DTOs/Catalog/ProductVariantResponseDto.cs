namespace Ecommerce.Application.DTOs.Catalog
{
    public class ProductVariantResponseDto
    {
        public Guid Id { get; set; }
        public string SKU { get; set; } = null!;
        public string Size { get; set; } = null!;
        public string Color { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
