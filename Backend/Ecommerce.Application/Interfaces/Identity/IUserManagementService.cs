using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Domain.Common;

namespace Ecommerce.Application.Interfaces.Identity
{
    /// <summary>
    /// Admin operations for managing users — viewing and blocking/unblocking.
    /// Split from the old IAdminService (ISP: separate user management from category management).
    /// </summary>
    public interface IUserManagementService
    {
        Task<PagedResult<UserResponseDto>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 10);
        Task<UserResponseDto> GetUserByIdAsync(Guid userId);
        Task<bool> ToggleUserBlockStatusAsync(Guid userId);
    }
}
