namespace Ecommerce.Domain.Entities
{
    /// <summary>
    /// Represents a product category with self-referencing hierarchy support.
    /// Root categories (Top Wear, Bottom Wear, etc.) have null ParentCategoryId.
    /// Subcategories (T-Shirts, Jeans, etc.) reference their parent via ParentCategoryId.
    /// </summary>
    public class Category
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;

        /// <summary>
        /// URL-friendly identifier for frontend routing (e.g., "top-wear/t-shirts").
        /// </summary>
        public string Slug { get; set; } = null!;

        public string? Description { get; set; }

        /// <summary>
        /// Category banner/thumbnail image URL for storefront display.
        /// </summary>
        public string? ImageUrl { get; set; }

        /// <summary>
        /// Controls the sort order of categories in navigation menus.
        /// </summary>
        public int DisplayOrder { get; set; }

        /// <summary>
        /// Toggle category visibility without deleting it from the database.
        /// </summary>
        public bool IsActive { get; set; } = true;

        // === Self-Referencing Hierarchy ===

        /// <summary>
        /// Nullable FK — null means this is a root category (Top Wear, Bottom Wear, etc.).
        /// Non-null means this is a subcategory under the referenced parent.
        /// </summary>
        public int? ParentCategoryId { get; set; }

        /// <summary>
        /// Navigation to the parent category. Null for root categories.
        /// </summary>
        public Category? ParentCategory { get; set; }

        /// <summary>
        /// Navigation to child subcategories under this category.
        /// </summary>
        public List<Category> SubCategories { get; set; } = new();

        // === Navigation Properties ===

        /// <summary>
        /// Products belonging to this category. Products are typically assigned
        /// to leaf categories (e.g., "T-Shirts") rather than root categories (e.g., "Top Wear").
        /// </summary>
        public List<Product> Products { get; set; } = new();
    }
}
