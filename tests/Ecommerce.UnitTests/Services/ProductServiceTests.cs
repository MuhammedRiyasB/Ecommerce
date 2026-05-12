using AutoMapper;
using Ecommerce.Application.DTOs.Catalog;
using Ecommerce.Application.Interfaces.Catalog;
using Ecommerce.Application.Services.Catalog;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using MockQueryable.Moq;
using Moq;

namespace Ecommerce.UnitTests.Services;

/// <summary>
/// Unit tests for ProductService — covers CRUD operations, Cloudinary integration,
/// SKU/Slug generation, cache invalidation, and category validation.
/// </summary>
public class ProductServiceTests
{
    private readonly Mock<IRepository<Product>> _productRepoMock;
    private readonly Mock<IRepository<Category>> _categoryRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<ICloudImageService> _cloudImageMock;
    private readonly IMemoryCache _cache;
    private readonly ProductService _sut;

    public ProductServiceTests()
    {
        _productRepoMock = new Mock<IRepository<Product>>();
        _categoryRepoMock = new Mock<IRepository<Category>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _cloudImageMock = new Mock<ICloudImageService>();
        _cache = new MemoryCache(new MemoryCacheOptions());

        _sut = new ProductService(
            _productRepoMock.Object,
            _categoryRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object,
            _cloudImageMock.Object,
            _cache);
    }

    private static CreateProductRequestDto CreateValidDto() => new()
    {
        ProductName = "Classic T-Shirt",
        Price = 999,
        Discount = 0,
        Quantity = 25,
        Description = "Premium cotton tee",
        Size = "M",
        Color = "Black",
        Material = "100% Cotton",
        CategoryId = 1
    };

    private static Category CreateCategory() => new()
    {
        CategoryId = 1,
        CategoryName = "T-Shirts",
        Slug = "t-shirts",
        IsActive = true
    };

    // ==================== AddProduct Tests ====================

    [Fact]
    public async Task AddProductAsync_ValidDto_SavesProduct()
    {
        // Arrange
        var dto = CreateValidDto();
        var category = CreateCategory();
        var product = new Product { Id = Guid.NewGuid(), ProductName = dto.ProductName };
        var imageMock = new Mock<IFormFile>();

        var categories = new List<Category> { category }.AsQueryable().BuildMock();
        _categoryRepoMock.Setup(r => r.Query()).Returns(categories);
        _cloudImageMock.Setup(s => s.UploadImageAsync(It.IsAny<IFormFile>()))
            .ReturnsAsync("https://cloudinary.com/image.jpg");
        _mapperMock.Setup(m => m.Map<Product>(dto)).Returns(product);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        await _sut.AddProductAsync(dto, imageMock.Object);

        // Assert
        _productRepoMock.Verify(r => r.AddAsync(It.IsAny<Product>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task AddProductAsync_InvalidCategory_ThrowsArgumentException()
    {
        // Arrange — category doesn't exist
        var emptyCategories = new List<Category>().AsQueryable().BuildMock();
        _categoryRepoMock.Setup(r => r.Query()).Returns(emptyCategories);

        var dto = CreateValidDto();
        var imageMock = new Mock<IFormFile>();

        // Act & Assert
        var act = () => _sut.AddProductAsync(dto, imageMock.Object);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Category*not found*");
    }

    [Fact]
    public async Task AddProductAsync_UploadsImageToCloudinary()
    {
        // Arrange
        var dto = CreateValidDto();
        var category = CreateCategory();
        var product = new Product { Id = Guid.NewGuid() };
        var imageMock = new Mock<IFormFile>();

        var categories = new List<Category> { category }.AsQueryable().BuildMock();
        _categoryRepoMock.Setup(r => r.Query()).Returns(categories);
        _mapperMock.Setup(m => m.Map<Product>(dto)).Returns(product);
        _cloudImageMock.Setup(s => s.UploadImageAsync(imageMock.Object))
            .ReturnsAsync("https://cloudinary.com/uploaded.jpg");
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        await _sut.AddProductAsync(dto, imageMock.Object);

        // Assert — Cloudinary upload must be called exactly once
        _cloudImageMock.Verify(s => s.UploadImageAsync(imageMock.Object), Times.Once);
    }

    [Fact]
    public async Task AddProductAsync_GeneratesSkuAndSlug()
    {
        // Arrange
        var dto = CreateValidDto();
        var category = CreateCategory();
        var product = new Product { Id = Guid.NewGuid(), ProductName = "Classic T-Shirt" };
        var imageMock = new Mock<IFormFile>();

        var categories = new List<Category> { category }.AsQueryable().BuildMock();
        _categoryRepoMock.Setup(r => r.Query()).Returns(categories);
        _mapperMock.Setup(m => m.Map<Product>(dto)).Returns(product);
        _cloudImageMock.Setup(s => s.UploadImageAsync(It.IsAny<IFormFile>()))
            .ReturnsAsync("https://cloudinary.com/img.jpg");
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        await _sut.AddProductAsync(dto, imageMock.Object);

        // Assert — SKU and Slug must be auto-generated (not null/empty)
        _productRepoMock.Verify(r => r.AddAsync(It.Is<Product>(p =>
            !string.IsNullOrEmpty(p.SKU) && !string.IsNullOrEmpty(p.Slug)
        )), Times.Once);
    }

    [Fact]
    public async Task AddProductAsync_InvalidatesCache()
    {
        // Arrange — pre-populate the cache
        _cache.Set("products_cache", new List<ProductResponseDto>());

        var dto = CreateValidDto();
        var category = CreateCategory();
        var product = new Product { Id = Guid.NewGuid() };
        var imageMock = new Mock<IFormFile>();

        var categories = new List<Category> { category }.AsQueryable().BuildMock();
        _categoryRepoMock.Setup(r => r.Query()).Returns(categories);
        _mapperMock.Setup(m => m.Map<Product>(dto)).Returns(product);
        _cloudImageMock.Setup(s => s.UploadImageAsync(It.IsAny<IFormFile>()))
            .ReturnsAsync("https://cloudinary.com/img.jpg");
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        await _sut.AddProductAsync(dto, imageMock.Object);

        // Assert — cache must be cleared after adding a product
        _cache.TryGetValue("products_cache", out _).Should().BeFalse();
    }

    // ==================== UpdateProduct Tests ====================

    [Fact]
    public async Task UpdateProductAsync_ExistingProduct_ReturnsTrue()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var existingProduct = new Product { Id = productId, ProductName = "Old Name" };
        var dto = CreateValidDto();
        var category = CreateCategory();
        var imageMock = new Mock<IFormFile>();

        var products = new List<Product> { existingProduct }.AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(products);

        var categories = new List<Category> { category }.AsQueryable().BuildMock();
        _categoryRepoMock.Setup(r => r.Query()).Returns(categories);

        _cloudImageMock.Setup(s => s.UploadImageAsync(It.IsAny<IFormFile>()))
            .ReturnsAsync("https://cloudinary.com/updated.jpg");
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        var result = await _sut.UpdateProductAsync(productId, dto, imageMock.Object);

        // Assert
        result.Should().BeTrue();
        _productRepoMock.Verify(r => r.Update(It.IsAny<Product>()), Times.Once);
    }

    [Fact]
    public async Task UpdateProductAsync_NonExistentProduct_ReturnsFalse()
    {
        // Arrange — empty product list
        var emptyProducts = new List<Product>().AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(emptyProducts);

        var dto = CreateValidDto();
        var imageMock = new Mock<IFormFile>();

        // Act
        var result = await _sut.UpdateProductAsync(Guid.NewGuid(), dto, imageMock.Object);

        // Assert
        result.Should().BeFalse();
    }

    // ==================== DeleteProduct Tests ====================

    [Fact]
    public async Task DeleteProductAsync_ExistingProduct_ReturnsTrue()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var product = new Product { Id = productId };
        _productRepoMock.Setup(r => r.GetByIdAsync(productId)).ReturnsAsync(product);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        var result = await _sut.DeleteProductAsync(productId);

        // Assert
        result.Should().BeTrue();
        _productRepoMock.Verify(r => r.Remove(product), Times.Once);
    }

    [Fact]
    public async Task DeleteProductAsync_NonExistentProduct_ReturnsFalse()
    {
        // Arrange
        _productRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Product?)null);

        // Act
        var result = await _sut.DeleteProductAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    // ==================== GetProduct Tests ====================

    [Fact]
    public async Task GetProductByIdAsync_NonExistent_ThrowsArgumentException()
    {
        // Arrange — no products
        var emptyProducts = new List<Product>().AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(emptyProducts);

        // Act & Assert
        var act = () => _sut.GetProductByIdAsync(Guid.NewGuid());
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*not found*");
    }
}
