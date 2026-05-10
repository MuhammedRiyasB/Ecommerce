using Ecommerce.Application.DTOs.Address;
using Ecommerce.Application.Interfaces.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Identity
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize]
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _addressService;
        public AddressController(IAddressService addressService) => _addressService = addressService;

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var userId))
                throw new UnauthorizedAccessException("User id not found in token");
            return userId;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddAddress([FromBody] CreateAddressRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Address data is required." });
            await _addressService.CreateAddressAsync(dto, GetUserId());
            return Ok(new { message = "Address added successfully" });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAddresses([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
            => Ok(await _addressService.GetAllAddressesAsync(GetUserId(), pageNumber, pageSize));


        [HttpDelete("{addressId}")]
        public async Task<IActionResult> DeleteAddress(Guid addressId)
        {
            var deleted = await _addressService.DeleteAddressAsync(GetUserId(), addressId);
            return deleted ? Ok(new { message = "Address deleted" }) : NotFound(new { message = "Address not found" });
        }
    }
}
