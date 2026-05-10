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
        Task AddProductAsync(CreateProductRequestDto productDto, IFormFile image);

        /// <summary>
        /// Updates an existing product. Re-uploads the image to Cloudinary.
        /// </summary>
        Task<bool> UpdateProductAsync(Guid productId, CreateProductRequestDto productDto, IFormFile image);

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
            string? size = null);

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
    }
}
