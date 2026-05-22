using Ecommerce.Application.DTOs.Cart;

namespace Ecommerce.Application.Interfaces.Cart
{
    /// <summary>
    /// Manages shopping cart operations for authenticated users.
    /// </summary>
    public interface ICartService
    {
        Task<CartResponseDto> GetUserCartAsync(Guid userId);
        Task<CartResponseDto> AddToCartAsync(Guid userId, AddToCartRequestDto dto);
        Task<bool> RemoveFromCartAsync(Guid userId, Guid cartItemId);
        Task<bool> IncreaseQuantityAsync(Guid userId, Guid cartItemId, int delta = 1);
        Task<bool> DecreaseQuantityAsync(Guid userId, Guid cartItemId, int delta = 1);
    }
}
