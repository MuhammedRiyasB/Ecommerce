using Ecommerce.Application.DTOs.Address;
using Ecommerce.Domain.Common;

namespace Ecommerce.Application.Interfaces.Identity
{
    /// <summary>
    /// Manages user addresses — CRUD operations scoped to a specific user.
    /// </summary>
    public interface IAddressService
    {
        Task<AddressResponseDto> CreateAddressAsync(CreateAddressRequestDto newAddress, Guid userId);
        Task<PagedResult<AddressResponseDto>> GetAllAddressesAsync(Guid userId, int pageNumber = 1, int pageSize = 10);
        Task<AddressResponseDto> UpdateAddressAsync(Guid userId, Guid addressId, CreateAddressRequestDto addressDto);
        Task<bool> DeleteAddressAsync(Guid userId, Guid addressId);
    }
}
