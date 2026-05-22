namespace Ecommerce.Application.DTOs.Catalog
{
    public class ProductVariantRequestDto
    {
        public string Size { get; set; } = null!;
        public string Color { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
