using Ecommerce.Application.DTOs.Catalog;
using Ecommerce.Application.Interfaces.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Catalog
{
    /// <summary>
    /// Product endpoints for the D2C men's clothing store.
    /// Supports CRUD, multi-criteria filtering, category browsing, and slug-based lookups.
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;
        public ProductController(IProductService productService) => _productService = productService;

        /// <summary>
        /// Creates a new clothing product with image upload.
        /// </summary>
        [HttpPost("Add")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddProduct([FromForm] CreateProductRequestDto productDto, [FromForm] List<IFormFile> images)
        {
            if (productDto == null) return BadRequest(new { message = "Product details cannot be null" });
            await _productService.AddProductAsync(productDto, images);
            return Ok(new { message = "Product added successfully" });
        }

        /// <summary>
        /// Returns a single product by its unique ID.
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductById(Guid id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            return product == null ? NotFound(new { message = $"Product with ID {id} not found" }) : Ok(product);
        }

        /// <summary>
        /// Returns a paginated list of products with optional filters.
        /// Supports filtering by category, search, price range, color, and size.
        /// </summary>
        [HttpGet("All")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllProducts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? search = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? color = null,
            [FromQuery] string? size = null)
        {
            return Ok(await _productService.GetAllProductsAsync(
                pageNumber, pageSize, categoryId, search, minPrice, maxPrice, color, size));
        }

        /// <summary>
        /// Returns paginated products for a specific category.
        /// Used for category landing pages on the storefront.
        /// </summary>
        [HttpGet("category/{categoryId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductsByCategory(
            int categoryId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            return Ok(await _productService.GetProductsByCategoryAsync(categoryId, pageNumber, pageSize));
        }

        /// <summary>
        /// Returns a single product by its URL-friendly slug.
        /// Used for frontend product detail pages (e.g., /products/classic-fit-crew-neck-t-shirt-a1b2c3).
        /// </summary>
        [HttpGet("slug/{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductBySlug(string slug)
        {
            var product = await _productService.GetProductBySlugAsync(slug);
            return product == null
                ? NotFound(new { message = $"Product with slug '{slug}' not found" })
                : Ok(product);
        }

        /// <summary>
        /// Updates an existing product by ID.
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromForm] CreateProductRequestDto productDto, [FromForm] List<IFormFile> images)
        {
            if (productDto == null) return BadRequest(new { message = "Product details cannot be null" });
            var updated = await _productService.UpdateProductAsync(id, productDto, images);
            return updated ? Ok(new { message = "Product updated successfully" }) : NotFound(new { message = $"Product with ID {id} not found" });
        }

        /// <summary>
        /// Backward-compatible update endpoint for older clients using /Product/Update?id=...
        /// </summary>
        [HttpPut("Update")]
        [Authorize(Roles = "Admin")]
        public Task<IActionResult> UpdateProductLegacy([FromQuery] Guid id, [FromForm] CreateProductRequestDto productDto, [FromForm] List<IFormFile> images)
        {
            return UpdateProduct(id, productDto, images);
        }

        /// <summary>
        /// Soft-deletes a product by ID. Product is hidden but retained for order history.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var deleted = await _productService.DeleteProductAsync(id);
            return deleted ? Ok(new { message = "Product deleted successfully" }) : NotFound(new { message = $"Product with ID {id} not found" });
        }

        /// <summary>
        /// Backward-compatible delete endpoint for older clients using /Product/Delete?id=...
        /// </summary>
        [HttpDelete("Delete")]
        [Authorize(Roles = "Admin")]
        public Task<IActionResult> DeleteProductLegacy([FromQuery] Guid id)
        {
            return DeleteProduct(id);
        }
        /// <summary>
        /// Returns recent products ordered by creation date (newest first).
        /// Supports pagination and optional price range filtering.
        /// </summary>
        [HttpGet("Recent")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRecentProducts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null)
        {
            return Ok(await _productService.GetRecentProductsAsync(pageNumber, pageSize, minPrice, maxPrice));
        }

        /// <summary>
        /// Returns the top-selling products based on order item quantities.
        /// </summary>
        [HttpGet("TopSelling")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTopSellingProducts([FromQuery] int count = 10)
        {
            return Ok(await _productService.GetTopSellingProductsAsync(count));
        }

        /// <summary>
        /// Returns products filtered by subcategory (leaf category in the hierarchy).
        /// </summary>
        [HttpGet("subcategory/{subCategoryId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductsBySubCategory(
            int subCategoryId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            return Ok(await _productService.GetProductsBySubCategoryAsync(subCategoryId, pageNumber, pageSize));
        }
    }
}
