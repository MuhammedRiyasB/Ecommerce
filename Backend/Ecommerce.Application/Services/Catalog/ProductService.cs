using AutoMapper;
using Ecommerce.Application.Common.ProductOptions;
using Ecommerce.Application.DTOs.Catalog;
using Ecommerce.Application.Interfaces.Catalog;
using Ecommerce.Domain.Common;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Ecommerce.Application.Extensions;
using System.Text.RegularExpressions;

namespace Ecommerce.Application.Services.Catalog
{
    public class ProductService : IProductService
    {
        private readonly IRepository<Product> _productRepo;
        private readonly IRepository<Category> _categoryRepo;
        private readonly IRepository<OrderItem> _orderItemRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICloudImageService _cloudImageService;
        private readonly IDistributedCache _cache;
        private const string PRODUCTS_CACHE_KEY = "products_cache";

        public ProductService(
            IRepository<Product> productRepo,
            IRepository<Category> categoryRepo,
            IRepository<OrderItem> orderItemRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ICloudImageService cloudImageService,
            IDistributedCache cache)
        {
            _productRepo = productRepo;
            _categoryRepo = categoryRepo;
            _orderItemRepo = orderItemRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cloudImageService = cloudImageService;
            _cache = cache;
        }

        public async Task AddProductAsync(CreateProductRequestDto productDto, IReadOnlyCollection<IFormFile> images)
        {
            if (images == null || images.Count == 0)
            {
                throw new ArgumentException("At least one product image is required.");
            }

            var category = await _categoryRepo.Query()
                .FirstOrDefaultAsync(c => c.CategoryId == productDto.CategoryId);

            if (category == null)
            {
                throw new ArgumentException($"Category with ID {productDto.CategoryId} not found.");
            }

            var normalizedVariants = NormalizeVariants(productDto.Variants);
            if (normalizedVariants.Count == 0)
            {
                throw new ArgumentException("At least one product variant is required.");
            }

            var normalizedSizes = normalizedVariants.Select(v => v.Size).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var normalizedColors = normalizedVariants.Select(v => v.Color).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            var product = _mapper.Map<Product>(productDto);
            product.Id = Guid.NewGuid();
            product.AvailableSizes = string.Join(", ", normalizedSizes);
            product.AvailableColors = string.Join(", ", normalizedColors);
            product.DeliverablePincodes = ProductOptionParser.NormalizePincodeCsv(productDto.DeliverablePincodes);
            product.Quantity = normalizedVariants.Sum(v => v.Quantity);
            product.Size = normalizedSizes[0];
            product.Color = normalizedColors[0];
            product.SKU = GenerateSku(category.CategoryName, product.Color, product.Size);
            product.Slug = GenerateSlug(productDto.ProductName);
            product.CreatedAtUtc = DateTime.UtcNow;
            product.Variants = normalizedVariants.Select(variant => new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                SKU = GenerateSku(category.CategoryName, variant.Color, variant.Size),
                Size = variant.Size,
                Color = variant.Color,
                Quantity = variant.Quantity,
                CreatedAtUtc = DateTime.UtcNow
            }).ToList();
            product.ProductImages ??= new List<ProductImage>();
            await SyncProductImagesAsync(
                product,
                Array.Empty<string>(),
                Array.Empty<string>(),
                productDto.NewImageColors,
                images,
                normalizedColors);
            product.Image = product.ProductImages[0].ImageUrl;

            await _productRepo.AddAsync(product);
            await _unitOfWork.SaveChangesAsync();
            _cache.Remove(PRODUCTS_CACHE_KEY);
        }

        public async Task<bool> UpdateProductAsync(Guid id, CreateProductRequestDto productDto, IReadOnlyCollection<IFormFile> images)
        {
            var product = await _productRepo.Query()
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return false;
            }

            var category = await _categoryRepo.Query()
                .FirstOrDefaultAsync(c => c.CategoryId == productDto.CategoryId);

            if (category == null)
            {
                throw new ArgumentException($"Category with ID {productDto.CategoryId} not found.");
            }

            var normalizedVariants = NormalizeVariants(productDto.Variants);
            if (normalizedVariants.Count == 0)
            {
                throw new ArgumentException("At least one product variant is required.");
            }

            var normalizedSizes = normalizedVariants.Select(v => v.Size).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var normalizedColors = normalizedVariants.Select(v => v.Color).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            _mapper.Map(productDto, product);
            product.AvailableSizes = string.Join(", ", normalizedSizes);
            product.AvailableColors = string.Join(", ", normalizedColors);
            product.DeliverablePincodes = ProductOptionParser.NormalizePincodeCsv(productDto.DeliverablePincodes);
            product.Quantity = normalizedVariants.Sum(v => v.Quantity);
            product.Size = normalizedSizes[0];
            product.Color = normalizedColors[0];
            product.SKU = GenerateSku(category.CategoryName, product.Color, product.Size);
            product.Slug = GenerateSlug(productDto.ProductName);
            product.UpdatedAtUtc = DateTime.UtcNow;

            SyncProductVariants(product, normalizedVariants, category.CategoryName);

            product.ProductImages ??= new List<ProductImage>();
            await SyncProductImagesAsync(
                product,
                productDto.RetainedImageUrls,
                productDto.RetainedImageColors,
                productDto.NewImageColors,
                images,
                normalizedColors);
            product.Image = product.ProductImages[0].ImageUrl;

            _productRepo.Update(product);
            await _unitOfWork.SaveChangesAsync();
            _cache.Remove(PRODUCTS_CACHE_KEY);
            return true;
        }

        public async Task<bool> DeleteProductAsync(Guid id)
        {
            var product = await _productRepo.GetByIdAsync(id);
            if (product == null)
            {
                return false;
            }

            _productRepo.Remove(product);
            await _unitOfWork.SaveChangesAsync();
            _cache.Remove(PRODUCTS_CACHE_KEY);
            return true;
        }

        public async Task<ProductResponseDto> GetProductByIdAsync(Guid productId)
        {
            var product = await _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                throw new ArgumentException($"Product with ID {productId} not found");
            }

            return _mapper.Map<ProductResponseDto>(product);
        }


        public async Task<ProductResponseDto?> GetProductBySlugAsync(string slug)
        {
            var product = await _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            return product == null ? null : _mapper.Map<ProductResponseDto>(product);
        }

        public async Task<PagedResult<ProductResponseDto>> GetAllProductsAsync(
            int pageNumber = 1,
            int pageSize = 10,
            int? categoryId = null,
            string? search = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? color = null,
            string? size = null,
            string? categorySlug = null,
            bool? isSale = null)
        {
            var cacheKey = $"products_p{pageNumber}_s{pageSize}_c{categoryId}_q{search}_min{minPrice}_max{maxPrice}_col{color}_sz{size}_slug{categorySlug}_sale{isSale}";
            var cachedResult = await _cache.GetRecordAsync<PagedResult<ProductResponseDto>>(cacheKey);
            
            if (cachedResult != null)
            {
                return cachedResult;
            }

            var query = _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .AsQueryable();

            query = ApplyFilters(query, categoryId, search, minPrice, maxPrice, color, size, categorySlug, isSale);

            var totalCount = await query.CountAsync();

            if (isSale == true)
            {
                query = query.OrderByDescending(p => p.TotalSold).ThenByDescending(p => p.CreatedAtUtc);
            }
            else
            {
                query = query.OrderByDescending(p => p.CreatedAtUtc);
            }

            var products = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new PagedResult<ProductResponseDto>
            {
                Items = _mapper.Map<List<ProductResponseDto>>(products),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            await _cache.SetRecordAsync(cacheKey, result, TimeSpan.FromMinutes(5));
            return result;
        }

        public async Task<PagedResult<ProductResponseDto>> GetProductsByCategoryAsync(
            int categoryId, int pageNumber = 1, int pageSize = 10)
        {
            return await GetAllProductsAsync(pageNumber, pageSize, categoryId: categoryId);
        }

        /// <summary>
        /// Returns recent products ordered by CreatedAtUtc descending.
        /// Supports pagination and optional price range filtering.
        /// </summary>
        public async Task<PagedResult<ProductResponseDto>> GetRecentProductsAsync(
            int pageNumber = 1, int pageSize = 10,
            decimal? minPrice = null, decimal? maxPrice = null)
        {
            var query = _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .AsQueryable();

            // Apply optional price filters on effective price (Price - Discount)
            if (minPrice.HasValue)
                query = query.Where(p => (p.Price - p.Discount) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.Price - p.Discount) <= maxPrice.Value);

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

        /// <summary>
        /// Returns top-selling products by aggregating OrderItem quantities.
        /// Groups sold quantities per product and returns the highest sellers.
        /// </summary>
        public async Task<List<ProductResponseDto>> GetTopSellingProductsAsync(int count = 10)
        {
            // Aggregate total sold quantity per product from order items
            var topProductIds = await _orderItemRepo.Query()
                .AsNoTracking()
                .GroupBy(oi => oi.ProductId)
                .Select(g => new { ProductId = g.Key, TotalSold = g.Sum(oi => oi.Quantity) })
                .OrderByDescending(x => x.TotalSold)
                .Take(count)
                .Select(x => x.ProductId)
                .ToListAsync();

            if (topProductIds.Count == 0)
                return new List<ProductResponseDto>();

            var products = await _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .Where(p => topProductIds.Contains(p.Id))
                .ToListAsync();

            // Preserve the top-selling order
            var ordered = topProductIds
                .Select(id => products.FirstOrDefault(p => p.Id == id))
                .Where(p => p != null)
                .ToList();

            return _mapper.Map<List<ProductResponseDto>>(ordered);
        }

        /// <summary>
        /// Returns products filtered by subcategory (leaf category in the hierarchy).
        /// </summary>
        public async Task<PagedResult<ProductResponseDto>> GetProductsBySubCategoryAsync(
            int subCategoryId, int pageNumber = 1, int pageSize = 10)
        {
            var query = _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.Variants)
                .Where(p => p.SubCategoryId == subCategoryId);

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

        private static IQueryable<Product> ApplyFilters(
            IQueryable<Product> query,
            int? categoryId,
            string? search,
            decimal? minPrice,
            decimal? maxPrice,
            string? color,
            string? size,
            string? categorySlug,
            bool? isSale)
        {
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value || p.SubCategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(categorySlug))
            {
                var slugLower = categorySlug.ToLower();
                if (slugLower == "formals")
                {
                    var formals = new[] { "shirts", "trousers", "jackets" };
                    query = query.Where(p => 
                        formals.Contains(p.Category.CategoryName.ToLower()) || 
                        (p.SubCategory != null && formals.Contains(p.SubCategory.CategoryName.ToLower())));
                }
                else if (slugLower == "occasional" || slugLower == "occasionwear")
                {
                    var occasionwear = new[] { "t-shirts", "hoodies", "sweatshirts", "jeans", "cargo pants", "joggers", "shorts" };
                    query = query.Where(p => 
                        occasionwear.Contains(p.Category.CategoryName.ToLower()) || 
                        (p.SubCategory != null && occasionwear.Contains(p.SubCategory.CategoryName.ToLower())));
                }
                else
                {
                    query = query.Where(p => p.Category.Slug.ToLower() == slugLower || (p.SubCategory != null && p.SubCategory.Slug.ToLower() == slugLower));
                }
            }

            if (isSale == true)
            {
                query = query.Where(p => p.Discount > 0);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p =>
                    p.ProductName.ToLower().Contains(searchLower) ||
                    p.Category.CategoryName.ToLower().Contains(searchLower) ||
                    (p.SubCategory != null && p.SubCategory.CategoryName.ToLower().Contains(searchLower)));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => (p.Price - p.Discount) >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => (p.Price - p.Discount) <= maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(color))
            {
                var normalizedColor = color.Trim().ToLower();
                query = query.Where(p => p.Variants.Any(v => v.Color.ToLower() == normalizedColor));
            }

            if (!string.IsNullOrWhiteSpace(size))
            {
                var normalizedSize = size.Trim().ToLower();
                query = query.Where(p => p.Variants.Any(v => v.Size.ToLower() == normalizedSize));
            }

            return query;
        }

        private static List<ProductVariantRequestDto> NormalizeVariants(IEnumerable<ProductVariantRequestDto> variants)
        {
            return variants
                .Where(variant => !string.IsNullOrWhiteSpace(variant.Size) && !string.IsNullOrWhiteSpace(variant.Color))
                .Select(variant => new ProductVariantRequestDto
                {
                    Size = variant.Size.Trim(),
                    Color = variant.Color.Trim(),
                    Quantity = variant.Quantity
                })
                .ToList();
        }

        private static string BuildVariantKey(string size, string color)
        {
            return $"{size.Trim().ToLowerInvariant()}|{color.Trim().ToLowerInvariant()}";
        }

        private static void SyncProductVariants(Product product, IReadOnlyList<ProductVariantRequestDto> requestedVariants, string categoryName)
        {
            var now = DateTime.UtcNow;
            var existingVariants = product.Variants.ToList();
            var unusedExistingVariants = existingVariants.ToList();
            var requestedWithoutExactMatch = new List<ProductVariantRequestDto>();

            foreach (var requestedVariant in requestedVariants)
            {
                var requestedKey = BuildVariantKey(requestedVariant.Size, requestedVariant.Color);
                var exactMatch = unusedExistingVariants.FirstOrDefault(existing =>
                    BuildVariantKey(existing.Size, existing.Color).Equals(requestedKey, StringComparison.OrdinalIgnoreCase));

                if (exactMatch == null)
                {
                    requestedWithoutExactMatch.Add(requestedVariant);
                    continue;
                }

                ApplyVariantUpdate(exactMatch, requestedVariant, categoryName, now);
                unusedExistingVariants.Remove(exactMatch);
            }

            foreach (var requestedVariant in requestedWithoutExactMatch)
            {
                var reusableVariant = unusedExistingVariants.FirstOrDefault();
                if (reusableVariant != null)
                {
                    ApplyVariantUpdate(reusableVariant, requestedVariant, categoryName, now);
                    unusedExistingVariants.Remove(reusableVariant);
                    continue;
                }

                product.Variants.Add(new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    SKU = GenerateSku(categoryName, requestedVariant.Color, requestedVariant.Size),
                    Size = requestedVariant.Size,
                    Color = requestedVariant.Color,
                    Quantity = requestedVariant.Quantity,
                    CreatedAtUtc = now
                });
            }

            foreach (var unusedVariant in unusedExistingVariants)
            {
                product.Variants.Remove(unusedVariant);
            }
        }

        private static void ApplyVariantUpdate(ProductVariant existingVariant, ProductVariantRequestDto requestedVariant, string categoryName, DateTime updatedAtUtc)
        {
            existingVariant.Size = requestedVariant.Size;
            existingVariant.Color = requestedVariant.Color;
            existingVariant.Quantity = requestedVariant.Quantity;
            existingVariant.SKU = GenerateSku(categoryName, requestedVariant.Color, requestedVariant.Size);
            existingVariant.UpdatedAtUtc = updatedAtUtc;
        }

        private static string GenerateSku(string categoryName, string color, string size)
        {
            var catCode = categoryName.Replace(" ", "").ToUpperInvariant();
            if (catCode.Length > 6)
            {
                catCode = catCode[..6];
            }

            var colorCode = color.Replace(" ", "").ToUpperInvariant();
            if (colorCode.Length > 3)
            {
                colorCode = colorCode[..3];
            }

            var sizeCode = size.ToUpperInvariant();
            var uniqueSuffix = Guid.NewGuid().ToString("N")[..4].ToUpperInvariant();

            return $"{catCode}-{colorCode}-{sizeCode}-{uniqueSuffix}";
        }

        private static string GenerateSlug(string name)
        {
            var slug = name.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');

            var suffix = Guid.NewGuid().ToString("N")[..6];
            return $"{slug}-{suffix}";
        }

        private async Task SyncProductImagesAsync(
            Product product,
            IReadOnlyCollection<string> retainedImageUrls,
            IReadOnlyCollection<string> retainedImageColors,
            IReadOnlyCollection<string> newImageColors,
            IReadOnlyCollection<IFormFile> uploadedFiles,
            IReadOnlyCollection<string> allowedColors)
        {
            var hasNewUploads = uploadedFiles != null && uploadedFiles.Any(file => file != null && file.Length > 0);
            var retainedUrls = retainedImageUrls?.ToList() ?? new List<string>();
            var retainedColorsList = retainedImageColors?.ToList() ?? new List<string>();
            var newImageColorsList = newImageColors?.ToList() ?? new List<string>();

            var imagesToRemove = product.ProductImages
                .Where(pi => !retainedUrls.Contains(pi.ImageUrl, StringComparer.OrdinalIgnoreCase))
                .ToList();

            foreach (var image in imagesToRemove)
            {
                product.ProductImages.Remove(image);
            }

            for (var index = 0; index < retainedUrls.Count; index++)
            {
                var imageUrl = retainedUrls[index]?.Trim();
                if (string.IsNullOrWhiteSpace(imageUrl))
                {
                    continue;
                }

                var existingImage = product.ProductImages.FirstOrDefault(pi => pi.ImageUrl.Equals(imageUrl, StringComparison.OrdinalIgnoreCase));
                var newColor = NormalizeImageColor(index < retainedColorsList.Count ? retainedColorsList[index] : null, allowedColors);

                if (existingImage != null)
                {
                    existingImage.DisplayOrder = index;
                    existingImage.IsPrimary = (index == 0);
                    existingImage.Color = newColor;
                }
                else
                {
                    product.ProductImages.Add(new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        ImageUrl = imageUrl,
                        Color = newColor,
                        DisplayOrder = index,
                        IsPrimary = (index == 0)
                    });
                }
            }

            if (hasNewUploads)
            {
                var uploadedImages = await UploadProductImagesAsync(
                    product.Id,
                    uploadedFiles ?? Array.Empty<IFormFile>(),
                    newImageColorsList,
                    allowedColors,
                    retainedUrls.Count);
                foreach (var uploadedImage in uploadedImages.Where(image => image != null))
                {
                    uploadedImage.IsPrimary = product.ProductImages.Count == 0;
                    product.ProductImages.Add(uploadedImage);
                }
            }

            if (product.ProductImages.Count == 0)
            {
                throw new ArgumentException("At least one product image is required.");
            }
        }

        private static string? NormalizeImageColor(string? value, IReadOnlyCollection<string> allowedColors)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var trimmedValue = value.Trim();
            var allowedColor = allowedColors.FirstOrDefault(color =>
                color.Equals(trimmedValue, StringComparison.OrdinalIgnoreCase));

            if (allowedColor == null)
            {
                throw new ArgumentException($"Image color '{trimmedValue}' does not match any product variant color.");
            }

            return allowedColor;
        }

        private async Task<List<ProductImage>> UploadProductImagesAsync(
            Guid productId,
            IEnumerable<IFormFile> images,
            IReadOnlyCollection<string> imageColors,
            IReadOnlyCollection<string> allowedColors,
            int displayOrderOffset)
        {
            var productImages = new List<ProductImage>();
            var validFiles = images.Where(file => file != null && file.Length > 0).ToList();
            var imageColorsList = imageColors?.ToList() ?? new List<string>();

            for (var index = 0; index < validFiles.Count; index++)
            {
                var image = validFiles[index];
                var imageUrl = await _cloudImageService.UploadImageAsync(image);
                productImages.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = productId,
                    ImageUrl = imageUrl,
                    Color = NormalizeImageColor(index < imageColorsList.Count ? imageColorsList[index] : null, allowedColors),
                    DisplayOrder = displayOrderOffset + index,
                    IsPrimary = displayOrderOffset + index == 0
                });
            }

            if (productImages.Count == 0)
            {
                throw new ArgumentException("At least one valid product image is required.");
            }

            return productImages;
        }
    }
}
