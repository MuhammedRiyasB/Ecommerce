namespace Ecommerce.Application.DTOs.Category
{
    /// <summary>
    /// Request DTO for creating a new product category.
    /// Supports hierarchical categories — set ParentCategoryId to create a subcategory.
    /// </summary>
    public class CreateCategoryRequestDto
    {
        /// <summary>
        /// Display name of the category (e.g., "T-Shirts", "Jeans").
        /// </summary>
        public string CategoryName { get; set; } = null!;

        /// <summary>
        /// Parent category ID for subcategories. Leave null to create a root category.
        /// Example: Set to the ID of "Top Wear" when creating "T-Shirts".
        /// </summary>
        public int? ParentCategoryId { get; set; }

        /// <summary>
        /// Optional description for storefront display.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Optional category image URL for storefront banners.
        /// </summary>
        public string? ImageUrl { get; set; }

        /// <summary>
        /// Controls the sort order in navigation menus. Lower values appear first.
        /// </summary>
        public int DisplayOrder { get; set; }
    }
}
