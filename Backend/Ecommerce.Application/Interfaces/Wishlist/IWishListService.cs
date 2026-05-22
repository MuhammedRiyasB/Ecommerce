using Ecommerce.Application.DTOs.Wishlist;
using Ecommerce.Domain.Common;

namespace Ecommerce.Application.Interfaces.Wishlist
{
    /// <summary>
    /// Manages user wishlists — add, remove, and view operations.
    /// </summary>
    public interface IWishListService
    {
        Task<bool> AddToWishListAsync(Guid userId, Guid productId);
        Task<bool> RemoveFromWishListAsync(Guid wishListId);
        Task<PagedResult<WishListItemResponseDto>> GetWishListAsync(Guid userId, int pageNumber = 1, int pageSize = 10);
    }
}
