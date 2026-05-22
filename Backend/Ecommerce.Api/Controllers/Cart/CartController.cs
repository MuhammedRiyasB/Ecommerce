using Ecommerce.Application.DTOs.Cart;
using Ecommerce.Application.Interfaces.Cart;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Cart
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        public CartController(ICartService cartService) => _cartService = cartService;

        private bool TryGetUserId(out Guid userId)
        {
            userId = Guid.Empty;
            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
            return claim != null && Guid.TryParse(claim.Value, out userId);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequestDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "User identity not found in token" });
            if (!ModelState.IsValid) return BadRequest(ModelState);
            return Ok(await _cartService.AddToCartAsync(userId, dto));
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "User identity not found in token" });
            return Ok(await _cartService.GetUserCartAsync(userId));
        }

        [HttpDelete("{cartItemId:guid}")]
        public async Task<IActionResult> RemoveItem([FromRoute] Guid cartItemId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "User identity not found in token" });
            var success = await _cartService.RemoveFromCartAsync(userId, cartItemId);
            return success ? Ok(new { message = "Item removed" }) : NotFound(new { message = "Item not found in cart" });
        }

        [HttpPut("decrease/{cartItemId:guid}")]
        public async Task<IActionResult> DecreaseQuantity([FromRoute] Guid cartItemId, [FromQuery][Range(1, int.MaxValue)] int delta = 1)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "User identity not found in token" });
            if (!ModelState.IsValid) return BadRequest(new { message = "Delta must be a positive integer (>= 1)" });
            var success = await _cartService.DecreaseQuantityAsync(userId, cartItemId, delta);
            return success ? Ok(new { message = "Quantity decreased" }) : BadRequest(new { message = "Cannot decrease quantity" });
        }

        [HttpPut("increase/{cartItemId:guid}")]
        public async Task<IActionResult> IncreaseQuantity([FromRoute] Guid cartItemId, [FromQuery][Range(1, int.MaxValue)] int delta = 1)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "User identity not found in token" });
            if (!ModelState.IsValid) return BadRequest(new { message = "Delta must be a positive integer (>= 1)" });
            var success = await _cartService.IncreaseQuantityAsync(userId, cartItemId, delta);
            return success ? Ok(new { message = "Quantity increased" }) : BadRequest(new { message = "Cannot increase quantity" });
        }
    }
}
