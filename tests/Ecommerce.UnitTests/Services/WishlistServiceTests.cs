using Ecommerce.Application.Services.Wishlist;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace Ecommerce.UnitTests.Services;

/// <summary>
/// Unit tests for WishlistService — covers add/remove operations,
/// duplicate product guard, invalid product handling, and pagination.
/// </summary>
public class WishlistServiceTests
{
    private readonly Mock<IRepository<WishList>> _wishRepoMock;
    private readonly Mock<IRepository<Product>> _productRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly WishListService _sut;

    public WishlistServiceTests()
    {
        _wishRepoMock = new Mock<IRepository<WishList>>();
        _productRepoMock = new Mock<IRepository<Product>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();

        _sut = new WishListService(
            _wishRepoMock.Object,
            _productRepoMock.Object,
            _unitOfWorkMock.Object);
    }

    // ==================== AddToWishList Tests ====================

    [Fact]
    public async Task AddToWishListAsync_ValidProduct_ReturnsTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        // Product exists
        var products = new List<Product> { new() { Id = productId } }.AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(products);

        // Not already in wishlist
        var emptyWishlist = new List<WishList>().AsQueryable().BuildMock();
        _wishRepoMock.Setup(r => r.Query()).Returns(emptyWishlist);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        var result = await _sut.AddToWishListAsync(userId, productId);

        // Assert
        result.Should().BeTrue();
        _wishRepoMock.Verify(r => r.AddAsync(It.IsAny<WishList>()), Times.Once);
    }

    [Fact]
    public async Task AddToWishListAsync_DuplicateProduct_ThrowsArgumentException()
    {
        // Arrange — product already in user's wishlist
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        var products = new List<Product> { new() { Id = productId } }.AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(products);

        var existingWish = new WishList { WishListId = Guid.NewGuid(), UserId = userId, ProductId = productId };
        var wishlist = new List<WishList> { existingWish }.AsQueryable().BuildMock();
        _wishRepoMock.Setup(r => r.Query()).Returns(wishlist);

        // Act & Assert
        var act = () => _sut.AddToWishListAsync(userId, productId);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*already exists in wishlist*");
    }

    [Fact]
    public async Task AddToWishListAsync_InvalidProduct_ThrowsArgumentException()
    {
        // Arrange — product doesn't exist
        var emptyProducts = new List<Product>().AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(emptyProducts);

        // Act & Assert
        var act = () => _sut.AddToWishListAsync(Guid.NewGuid(), Guid.NewGuid());
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Product not found*");
    }

    // ==================== RemoveFromWishList Tests ====================

    [Fact]
    public async Task RemoveFromWishListAsync_ValidItem_ReturnsTrue()
    {
        // Arrange
        var wishListId = Guid.NewGuid();
        var wishItem = new WishList { WishListId = wishListId, UserId = Guid.NewGuid(), ProductId = Guid.NewGuid() };

        var wishlist = new List<WishList> { wishItem }.AsQueryable().BuildMock();
        _wishRepoMock.Setup(r => r.Query()).Returns(wishlist);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        var result = await _sut.RemoveFromWishListAsync(wishListId);

        // Assert
        result.Should().BeTrue();
        _wishRepoMock.Verify(r => r.Remove(wishItem), Times.Once);
    }

    [Fact]
    public async Task RemoveFromWishListAsync_InvalidItem_ReturnsFalse()
    {
        // Arrange — wishlist item doesn't exist
        var emptyWishlist = new List<WishList>().AsQueryable().BuildMock();
        _wishRepoMock.Setup(r => r.Query()).Returns(emptyWishlist);

        // Act
        var result = await _sut.RemoveFromWishListAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    // ==================== GetWishList Tests ====================

    [Fact]
    public async Task GetWishListAsync_ReturnsPagedResults()
    {
        // Arrange — user has 3 items in wishlist
        var userId = Guid.NewGuid();
        var product1 = new Product { Id = Guid.NewGuid(), ProductName = "Shirt 1", Price = 500, Image = "img1.jpg" };
        var product2 = new Product { Id = Guid.NewGuid(), ProductName = "Shirt 2", Price = 600, Image = "img2.jpg" };
        var product3 = new Product { Id = Guid.NewGuid(), ProductName = "Shirt 3", Price = 700, Image = "img3.jpg" };

        var wishItems = new List<WishList>
        {
            new() { WishListId = Guid.NewGuid(), UserId = userId, ProductId = product1.Id },
            new() { WishListId = Guid.NewGuid(), UserId = userId, ProductId = product2.Id },
            new() { WishListId = Guid.NewGuid(), UserId = userId, ProductId = product3.Id }
        };

        var products = new List<Product> { product1, product2, product3 };

        var wishMock = wishItems.AsQueryable().BuildMock();
        _wishRepoMock.Setup(r => r.Query()).Returns(wishMock);

        var productMock = products.AsQueryable().BuildMock();
        _productRepoMock.Setup(r => r.Query()).Returns(productMock);

        // Act — request page 1 with page size 2
        var result = await _sut.GetWishListAsync(userId, pageNumber: 1, pageSize: 2);

        // Assert — should return 2 items on first page, with total count of 3
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(3);
        result.PageNumber.Should().Be(1);
    }
}
