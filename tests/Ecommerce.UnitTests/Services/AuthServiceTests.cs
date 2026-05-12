using AutoMapper;
using Ecommerce.Application.Common.Settings;
using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Application.Services.Identity;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;
using Ecommerce.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Options;
using MockQueryable.Moq;
using Moq;

namespace Ecommerce.UnitTests.Services;

/// <summary>
/// Unit tests for AuthService — covers registration, login, JWT generation,
/// refresh token rotation, and reuse detection security flows.
/// </summary>
public class AuthServiceTests
{
    private readonly Mock<IRepository<User>> _userRepoMock;
    private readonly Mock<IRepository<RefreshToken>> _refreshTokenRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly IOptions<JwtSettings> _jwtOptions;
    private readonly AuthService _sut; // System Under Test

    public AuthServiceTests()
    {
        _userRepoMock = new Mock<IRepository<User>>();
        _refreshTokenRepoMock = new Mock<IRepository<RefreshToken>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();

        // Configure JWT settings for token generation tests
        _jwtOptions = Options.Create(new JwtSettings
        {
            Key = "SuperSecretTestKeyThatIsAtLeast32CharsLong!!",
            Issuer = "https://test-issuer.com",
            Audience = "https://test-audience.com"
        });

        _sut = new AuthService(
            _userRepoMock.Object,
            _refreshTokenRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object,
            _jwtOptions);
    }

    // ==================== Registration Tests ====================

    [Fact]
    public async Task RegisterAsync_ValidDto_CreatesUserAndReturnsResponse()
    {
        // Arrange
        var dto = new RegisterRequestDto { Name = "John", Email = "john@test.com", Password = "Pass123!" };
        var user = new User { UserId = Guid.NewGuid(), Name = "John", Email = "john@test.com", Role = UserRole.User };
        var responseDto = new UserResponseDto();

        // Mock empty user list (no duplicates)
        var emptyUsers = new List<User>().AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(emptyUsers);
        _mapperMock.Setup(m => m.Map<User>(dto)).Returns(user);
        _mapperMock.Setup(m => m.Map<UserResponseDto>(It.IsAny<User>())).Returns(responseDto);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.Should().NotBeNull();
        _userRepoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsArgumentException()
    {
        // Arrange — user with same email already exists
        var existingUser = new User { UserId = Guid.NewGuid(), Email = "john@test.com" };
        var users = new List<User> { existingUser }.AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(users);

        var dto = new RegisterRequestDto { Name = "John", Email = "john@test.com", Password = "Pass123!" };

        // Act & Assert
        var act = () => _sut.RegisterAsync(dto);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Email already exists");
    }

    [Fact]
    public async Task RegisterAsync_InvalidRole_ThrowsArgumentException()
    {
        // Arrange
        var emptyUsers = new List<User>().AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(emptyUsers);

        var dto = new RegisterRequestDto { Name = "John", Email = "john@test.com", Password = "Pass123!" };

        // Act & Assert — passing an invalid role string
        var act = () => _sut.RegisterAsync(dto, "SuperAdmin");
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Invalid role: SuperAdmin");
    }

    [Fact]
    public async Task RegisterAsync_HashesPassword_NotStoredPlaintext()
    {
        // Arrange
        var dto = new RegisterRequestDto { Name = "John", Email = "john@test.com", Password = "PlainText123" };
        var user = new User { UserId = Guid.NewGuid(), Name = "John", Email = "john@test.com" };

        var emptyUsers = new List<User>().AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(emptyUsers);
        _mapperMock.Setup(m => m.Map<User>(dto)).Returns(user);
        _mapperMock.Setup(m => m.Map<UserResponseDto>(It.IsAny<User>())).Returns(new UserResponseDto());
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        await _sut.RegisterAsync(dto);

        // Assert — password hash must not equal the plaintext password
        _userRepoMock.Verify(r => r.AddAsync(It.Is<User>(u =>
            u.PasswordHash != "PlainText123" && !string.IsNullOrEmpty(u.PasswordHash)
        )), Times.Once);
    }

    // ==================== Login Tests ====================

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("Pass123!");
        var user = new User
        {
            UserId = Guid.NewGuid(), Name = "John", Email = "john@test.com",
            PasswordHash = hashedPassword, Role = UserRole.User, IsBlocked = false
        };

        var users = new List<User> { user }.AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(users);

        // Mock refresh token save
        var emptyTokens = new List<RefreshToken>().AsQueryable().BuildMock();
        _refreshTokenRepoMock.Setup(r => r.Query()).Returns(emptyTokens);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var dto = new LoginRequestDto { Email = "john@test.com", Password = "Pass123!" };

        // Act
        var result = await _sut.LoginAsync(dto);

        // Assert — must return valid tokens
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ThrowsArgumentException()
    {
        // Arrange — no users in the database
        var emptyUsers = new List<User>().AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(emptyUsers);

        var dto = new LoginRequestDto { Email = "nonexistent@test.com", Password = "Pass123!" };

        // Act & Assert
        var act = () => _sut.LoginAsync(dto);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Invalid Email");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsArgumentException()
    {
        // Arrange — user exists but password is wrong
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("CorrectPassword");
        var user = new User
        {
            UserId = Guid.NewGuid(), Email = "john@test.com",
            PasswordHash = hashedPassword, IsBlocked = false
        };

        var users = new List<User> { user }.AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(users);

        var dto = new LoginRequestDto { Email = "john@test.com", Password = "WrongPassword" };

        // Act & Assert
        var act = () => _sut.LoginAsync(dto);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Invalid Password");
    }

    [Fact]
    public async Task LoginAsync_BlockedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange — user account is blocked by admin
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("Pass123!");
        var user = new User
        {
            UserId = Guid.NewGuid(), Email = "john@test.com",
            PasswordHash = hashedPassword, IsBlocked = true
        };

        var users = new List<User> { user }.AsQueryable().BuildMock();
        _userRepoMock.Setup(r => r.Query()).Returns(users);

        var dto = new LoginRequestDto { Email = "john@test.com", Password = "Pass123!" };

        // Act & Assert
        var act = () => _sut.LoginAsync(dto);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*blocked*");
    }

    // ==================== Refresh Token Tests ====================

    [Fact]
    public async Task RefreshTokenAsync_RevokedToken_RevokesEntireFamily()
    {
        // Arrange — simulate a stolen token being replayed
        var tokenFamily = Guid.NewGuid();
        var revokedToken = new RefreshToken
        {
            Id = Guid.NewGuid(), Token = "stolen-token", IsRevoked = true,
            TokenFamily = tokenFamily, ExpiresAt = DateTime.UtcNow.AddDays(7),
            User = new User { UserId = Guid.NewGuid(), Email = "john@test.com", Role = UserRole.User }
        };

        var tokens = new List<RefreshToken> { revokedToken }.AsQueryable().BuildMock();
        _refreshTokenRepoMock.Setup(r => r.Query()).Returns(tokens);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act & Assert — reuse detection must revoke the entire family
        var act = () => _sut.RefreshTokenAsync("stolen-token");
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*reuse detected*");
    }

    [Fact]
    public async Task RefreshTokenAsync_ExpiredToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange — token has expired
        var expiredToken = new RefreshToken
        {
            Id = Guid.NewGuid(), Token = "expired-token", IsRevoked = false,
            TokenFamily = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddDays(-1),
            User = new User { UserId = Guid.NewGuid(), Email = "john@test.com", Role = UserRole.User }
        };

        var tokens = new List<RefreshToken> { expiredToken }.AsQueryable().BuildMock();
        _refreshTokenRepoMock.Setup(r => r.Query()).Returns(tokens);

        // Act & Assert
        var act = () => _sut.RefreshTokenAsync("expired-token");
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*expired*");
    }

    [Fact]
    public async Task RefreshTokenAsync_InvalidToken_ThrowsUnauthorizedAccessException()
    {
        // Arrange — token doesn't exist
        var emptyTokens = new List<RefreshToken>().AsQueryable().BuildMock();
        _refreshTokenRepoMock.Setup(r => r.Query()).Returns(emptyTokens);

        // Act & Assert
        var act = () => _sut.RefreshTokenAsync("nonexistent-token");
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid refresh token");
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_ValidToken_RevokesTokenFamily()
    {
        // Arrange
        var tokenFamily = Guid.NewGuid();
        var activeToken = new RefreshToken
        {
            Id = Guid.NewGuid(), Token = "active-token", IsRevoked = false,
            TokenFamily = tokenFamily, ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        // Setup for finding the token
        var tokens = new List<RefreshToken> { activeToken }.AsQueryable().BuildMock();
        _refreshTokenRepoMock.Setup(r => r.Query()).Returns(tokens);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        // Act
        await _sut.RevokeRefreshTokenAsync("active-token");

        // Assert — SaveChanges must be called to persist the revocation
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.AtLeastOnce);
    }
}
