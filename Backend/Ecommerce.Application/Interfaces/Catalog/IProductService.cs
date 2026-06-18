using Ecommerce.Application.DTOs.Catalog;
using Ecommerce.Domain.Common;
using Microsoft.AspNetCore.Http;

namespace Ecommerce.Application.Interfaces.Catalog
{
    /// <summary>
    /// Manages products — CRUD operations with image upload, filtering, and category-based browsing.
    /// Designed for a D2C men's clothing store with clothing-specific attributes.
    /// </summary>
    public interface IProductService
    {
        /// <summary>
        /// Creates a new product with Cloudinary image upload.
        /// Auto-generates SKU and Slug from product attributes.
        /// </summary>
        Task AddProductAsync(CreateProductRequestDto productDto, IReadOnlyCollection<IFormFile> images);

        /// <summary>
        /// Updates an existing product. Re-uploads the image to Cloudinary.
        /// </summary>
        Task<bool> UpdateProductAsync(Guid productId, CreateProductRequestDto productDto, IReadOnlyCollection<IFormFile> images);

        /// <summary>
        /// Soft-deletes a product by ID. Product is hidden but retained in the database.
        /// </summary>
        Task<bool> DeleteProductAsync(Guid id);

        /// <summary>
        /// Returns a paginated, filtered list of products.
        /// Supports filtering by category, search term, price range, color, and size.
        /// </summary>
        Task<PagedResult<ProductResponseDto>> GetAllProductsAsync(
            int pageNumber = 1,
            int pageSize = 10,
            int? categoryId = null,
            string? search = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? color = null,
            string? size = null,
            string? categorySlug = null,
            bool? isSale = null);

        /// <summary>
        /// Returns a single product by its unique ID.
        /// </summary>
        Task<ProductResponseDto> GetProductByIdAsync(Guid id);

        /// <summary>
        /// Returns paginated products belonging to a specific category.
        /// Useful for category landing pages on the storefront.
        /// </summary>
        Task<PagedResult<ProductResponseDto>> GetProductsByCategoryAsync(
            int categoryId, int pageNumber = 1, int pageSize = 10);

        /// <summary>
        /// Finds a product by its URL-friendly slug for frontend routing.
        /// </summary>
        Task<ProductResponseDto?> GetProductBySlugAsync(string slug);

        /// <summary>
        /// Returns recent products ordered by creation date (newest first).
        /// Supports pagination and optional price range filtering.
        /// </summary>
        Task<PagedResult<ProductResponseDto>> GetRecentProductsAsync(
            int pageNumber = 1, int pageSize = 10,
            decimal? minPrice = null, decimal? maxPrice = null);

        /// <summary>
        /// Returns the top-selling products based on order item quantities.
        /// </summary>
        Task<List<ProductResponseDto>> GetTopSellingProductsAsync(int count = 10);

        /// <summary>
        /// Returns products filtered by subcategory (leaf category in the hierarchy).
        /// </summary>
        Task<PagedResult<ProductResponseDto>> GetProductsBySubCategoryAsync(
            int subCategoryId, int pageNumber = 1, int pageSize = 10);

        /// <summary>
        /// Returns lightweight search suggestions for the autocomplete dropdown.
        /// Uses projection-only queries (no Include joins) for maximum performance.
        /// Results are cached in Redis for 30 seconds per query term.
        /// </summary>
        Task<List<SearchSuggestionDto>> SearchSuggestionsAsync(string query, int limit = 6);
    }
}
