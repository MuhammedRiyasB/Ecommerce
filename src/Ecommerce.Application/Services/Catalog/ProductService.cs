using AutoMapper;
using Ecommerce.Application.DTOs.Catalog;
using Ecommerce.Application.Interfaces.Catalog;
using Ecommerce.Domain.Common;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text.RegularExpressions;

namespace Ecommerce.Application.Services.Catalog
{
    /// <summary>
    /// Manages products for the D2C men's clothing store.
    /// Supports CRUD operations with Cloudinary image uploads,
    /// multi-criteria filtering, auto-generated SKU/Slug, and in-memory caching.
    /// </summary>
    public class ProductService : IProductService
    {
        private readonly IRepository<Product> _productRepo;
        private readonly IRepository<Category> _categoryRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICloudImageService _cloudImageService;
        private readonly IMemoryCache _cache;
        private const string PRODUCTS_CACHE_KEY = "products_cache";

        public ProductService(
            IRepository<Product> productRepo,
            IRepository<Category> categoryRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ICloudImageService cloudImageService,
            IMemoryCache cache)
        {
            _productRepo = productRepo;
            _categoryRepo = categoryRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cloudImageService = cloudImageService;
            _cache = cache;
        }

        /// <inheritdoc />
        public async Task AddProductAsync(CreateProductRequestDto productDto, IFormFile image)
        {
            // Validate category exists
            var category = await _categoryRepo.Query()
                .FirstOrDefaultAsync(c => c.CategoryId == productDto.CategoryId);

            if (category == null)
                throw new ArgumentException($"Category with ID {productDto.CategoryId} not found.");

            // Upload product image to Cloudinary
            string imageUrl = await _cloudImageService.UploadImageAsync(image);

            var product = _mapper.Map<Product>(productDto);
            product.Image = imageUrl;
            product.SKU = GenerateSku(category.CategoryName, productDto.Color, productDto.Size);
            product.Slug = GenerateSlug(productDto.ProductName);
            product.CreatedAtUtc = DateTime.UtcNow;

            await _productRepo.AddAsync(product);
            await _unitOfWork.SaveChangesAsync();

            // Invalidate product cache after new addition
            _cache.Remove(PRODUCTS_CACHE_KEY);
        }

        /// <inheritdoc />
        public async Task<bool> UpdateProductAsync(Guid id, CreateProductRequestDto productDto, IFormFile image)
        {
            var product = await _productRepo.Query()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return false;

            // Validate category exists
            var category = await _categoryRepo.Query()
                .FirstOrDefaultAsync(c => c.CategoryId == productDto.CategoryId);

            if (category == null)
                throw new ArgumentException($"Category with ID {productDto.CategoryId} not found.");

            // Upload updated image
            string imageUrl = await _cloudImageService.UploadImageAsync(image);
            product.Image = imageUrl;

            // Map updated fields from DTO to entity
            _mapper.Map(productDto, product);

            // Regenerate SKU and Slug based on updated attributes
            product.SKU = GenerateSku(category.CategoryName, productDto.Color, productDto.Size);
            product.Slug = GenerateSlug(productDto.ProductName);
            product.UpdatedAtUtc = DateTime.UtcNow;

            _productRepo.Update(product);
            await _unitOfWork.SaveChangesAsync();

            _cache.Remove(PRODUCTS_CACHE_KEY);
            return true;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteProductAsync(Guid id)
        {
            var product = await _productRepo.GetByIdAsync(id);
            if (product == null) return false;

            // Triggers soft delete via AppDbContext.SaveChangesAsync override
            _productRepo.Remove(product);
            await _unitOfWork.SaveChangesAsync();

            _cache.Remove(PRODUCTS_CACHE_KEY);
            return true;
        }

        /// <inheritdoc />
        public async Task<ProductResponseDto> GetProductByIdAsync(Guid productId)
        {
            var product = await _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new ArgumentException($"Product with ID {productId} not found");

            return _mapper.Map<ProductResponseDto>(product);
        }

        /// <inheritdoc />
        public async Task<ProductResponseDto?> GetProductBySlugAsync(string slug)
        {
            var product = await _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            return product == null ? null : _mapper.Map<ProductResponseDto>(product);
        }

        /// <inheritdoc />
        public async Task<PagedResult<ProductResponseDto>> GetAllProductsAsync(
            int pageNumber = 1,
            int pageSize = 10,
            int? categoryId = null,
            string? search = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? color = null,
            string? size = null)
        {
            var query = _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .AsQueryable();

            // Apply filters dynamically — only active filters affect the query
            query = ApplyFilters(query, categoryId, search, minPrice, maxPrice, color, size);

            var totalCount = await query.CountAsync();

            var products = await query
                .OrderByDescending(p => p.CreatedAtUtc)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ProductResponseDto>
            {
                Items = _mapper.Map<List<ProductResponseDto>>(products),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        /// <inheritdoc />
        public async Task<PagedResult<ProductResponseDto>> GetProductsByCategoryAsync(
            int categoryId, int pageNumber = 1, int pageSize = 10)
        {
            return await GetAllProductsAsync(pageNumber, pageSize, categoryId: categoryId);
        }

        /// <summary>
        /// Applies optional filters to the product query.
        /// Each filter is only applied if its parameter is non-null/non-empty.
        /// </summary>
        private static IQueryable<Product> ApplyFilters(
            IQueryable<Product> query,
            int? categoryId,
            string? search,
            decimal? minPrice,
            decimal? maxPrice,
            string? color,
            string? size)
        {
            // Filter by category — exact match on the leaf category
            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            // Full-text search on product name and description
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p =>
                    p.ProductName.ToLower().Contains(searchLower) ||
                    p.Description.ToLower().Contains(searchLower));
            }

            // Price range filters — effective price = Price - Discount
            if (minPrice.HasValue)
                query = query.Where(p => (p.Price - p.Discount) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.Price - p.Discount) <= maxPrice.Value);

            // Color filter — case-insensitive exact match
            if (!string.IsNullOrWhiteSpace(color))
                query = query.Where(p => p.Color.ToLower() == color.ToLower());

            // Size filter — case-insensitive exact match
            if (!string.IsNullOrWhiteSpace(size))
                query = query.Where(p => p.Size.ToLower() == size.ToLower());

            return query;
        }

        /// <summary>
        /// Generates a Stock Keeping Unit from category, color, and size.
        /// Format: "CAT-COL-SIZ-GUID" (e.g., "TSHIRT-BLK-M-A1B2").
        /// </summary>
        private static string GenerateSku(string categoryName, string color, string size)
        {
            var catCode = categoryName.Replace(" ", "").ToUpperInvariant();
            if (catCode.Length > 6) catCode = catCode[..6];

            var colorCode = color.Replace(" ", "").ToUpperInvariant();
            if (colorCode.Length > 3) colorCode = colorCode[..3];

            var sizeCode = size.ToUpperInvariant();
            var uniqueSuffix = Guid.NewGuid().ToString("N")[..4].ToUpperInvariant();

            return $"{catCode}-{colorCode}-{sizeCode}-{uniqueSuffix}";
        }

        /// <summary>
        /// Generates a URL-friendly slug from a product name.
        /// Appends a short unique suffix to prevent collisions.
        /// Example: "Classic Fit T-Shirt" → "classic-fit-t-shirt-a1b2"
        /// </summary>
        private static string GenerateSlug(string name)
        {
            var slug = name.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');

            // Append unique suffix to prevent slug collisions for similarly named products
            var suffix = Guid.NewGuid().ToString("N")[..6];
            return $"{slug}-{suffix}";
        }
    }
}
