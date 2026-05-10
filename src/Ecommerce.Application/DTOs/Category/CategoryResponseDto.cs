namespace Ecommerce.Application.DTOs.Category
{
    /// <summary>
    /// Response DTO for category data including hierarchy information.
    /// SubCategories is populated when returning the full category tree.
    /// </summary>
    public class CategoryResponseDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public int? ParentCategoryId { get; set; }

        /// <summary>
        /// Nested subcategories — populated when requesting the category tree.
        /// Empty for leaf categories (e.g., "T-Shirts" has no children).
        /// </summary>
        public List<CategoryResponseDto> SubCategories { get; set; } = new();
    }
}
