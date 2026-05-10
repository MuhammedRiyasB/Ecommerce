namespace Ecommerce.Application.DTOs.Catalog
{
    /// <summary>
    /// Request DTO for creating or updating a product in the D2C clothing store.
    /// All products are from the store owner's brand — no multi-brand fields needed.
    /// </summary>
    public class CreateProductRequestDto
    {
        /// <summary>
        /// Display name of the product (e.g., "Classic Fit Crew Neck T-Shirt").
        /// </summary>
        public string ProductName { get; set; } = null!;

        /// <summary>
        /// Available stock quantity for this product variant.
        /// </summary>
        public int Quantity { get; set; }

        /// <summary>
        /// Selling price in the store's currency (e.g., 999.50).
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Discount amount. Must be >= 0 and &lt;= Price.
        /// </summary>
        public decimal Discount { get; set; }

        public string Description { get; set; } = null!;

        /// <summary>
        /// Clothing size (e.g., "S", "M", "L", "XL", "28", "30", "32").
        /// </summary>
        public string Size { get; set; } = null!;

        /// <summary>
        /// Primary color of the garment (e.g., "Black", "Navy Blue").
        /// </summary>
        public string Color { get; set; } = null!;

        /// <summary>
        /// Fabric composition (e.g., "100% Cotton"). Optional.
        /// </summary>
        public string? Material { get; set; }

        /// <summary>
        /// ID of the leaf category this product belongs to (e.g., T-Shirts category ID).
        /// </summary>
        public int CategoryId { get; set; }
    }
}
