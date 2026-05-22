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
        /// Comma-separated six-digit pincodes this product can be delivered to.
        /// </summary>
        public string DeliverablePincodes { get; set; } = null!;

        /// <summary>
        /// Variant rows with actual size/color/stock combinations.
        /// </summary>
        public List<ProductVariantRequestDto> Variants { get; set; } = new();

        /// <summary>
        /// Fabric composition (e.g., "100% Cotton"). Optional.
        /// </summary>
        public string? Material { get; set; }

        /// <summary>
        /// ID of the root category (e.g., "Top Wear").
        /// </summary>
        public int CategoryId { get; set; }

        /// <summary>
        /// Optional ID of the subcategory under the root category (e.g., "T-Shirts").
        /// Nullable — if the category has no subcategories, this can be omitted.
        /// </summary>
        public int? SubCategoryId { get; set; }
    }
}
