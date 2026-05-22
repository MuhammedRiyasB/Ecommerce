using AutoMapper;
using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Application.Interfaces.Identity;
using Ecommerce.Domain.Common;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Domain.Enums;

namespace Ecommerce.Application.Services.Identity
{
    /// <summary>
    /// ISP fix: handles only user management operations (was previously combined with category management in AdminService).
    /// </summary>
    public class UserManagementService : IUserManagementService
    {
        private readonly IRepository<User> _userRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UserManagementService(IRepository<User> userRepo, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _userRepo = userRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<UserResponseDto>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 10)
        {
            var query = _userRepo.Query().Where(u => u.Role != UserRole.Admin);
            var totalCount = await query.CountAsync();

            var users = await query
                .Skip((pageNumber - 1) * pageSize).Take(pageSize)
                .ToListAsync();

            return new PagedResult<UserResponseDto>
            {
                Items = _mapper.Map<List<UserResponseDto>>(users),
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<UserResponseDto> GetUserByIdAsync(Guid userId)
        {
            var user = await _userRepo.Query().FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            return _mapper.Map<UserResponseDto>(user);
        }

        public async Task<bool> ToggleUserBlockStatusAsync(Guid userId)
        {
            var user = await _userRepo.Query().FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                throw new ArgumentException("User not found.");

            user.IsBlocked = !user.IsBlocked;
            await _unitOfWork.SaveChangesAsync();
            return user.IsBlocked;
        }
    }
}
