using Ecommerce.Application.Interfaces.Wishlist;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Wishlist
{
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiController]
    [ApiVersion("1.0")]
    public class WishlistController : ControllerBase
    {
        private readonly IWishListService _wishlistService;
        public WishlistController(IWishListService wishlistService) => _wishlistService = wishlistService;

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var userId))
                throw new UnauthorizedAccessException("User id not found in token");
            return userId;
        }

        [HttpPost("add")]
        [Authorize]
        public async Task<IActionResult> AddToWishlist([FromQuery] Guid productId)
        {
            var success = await _wishlistService.AddToWishListAsync(GetUserId(), productId);
            return Ok(new { message = "Product added to wishlist", success });
        }

        [HttpDelete("remove/{wishlistId}")]
        [Authorize]
        public async Task<IActionResult> RemoveFromWishlist(Guid wishlistId)
        {
            var success = await _wishlistService.RemoveFromWishListAsync(wishlistId);
            return success ? Ok(new { message = "Product removed from wishlist" }) : NotFound(new { message = "Wishlist item not found" });
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetWishlist([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
            => Ok(await _wishlistService.GetWishListAsync(GetUserId(), pageNumber, pageSize));
    }
}
