using Ecommerce.Application.DTOs.Wishlist;
using Ecommerce.Application.Interfaces.Wishlist;
using Ecommerce.Domain.Common;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Application.Services.Wishlist
{
    public class WishListService : IWishListService
    {
        private readonly IRepository<WishList> _wishRepo;
        private readonly IRepository<Product> _productRepo;
        private readonly IUnitOfWork _unitOfWork;

        public WishListService(IRepository<WishList> wishRepo, IRepository<Product> productRepo, IUnitOfWork unitOfWork)
        {
            _wishRepo = wishRepo;
            _productRepo = productRepo;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> AddToWishListAsync(Guid userId, Guid productId)
        {
            if (!await _productRepo.Query().AnyAsync(p => p.Id == productId))
                throw new ArgumentException("Product not found.");

            if (await _wishRepo.Query().AnyAsync(w => w.ProductId == productId && w.UserId == userId))
                throw new ArgumentException("Product already exists in wishlist.");

            await _wishRepo.AddAsync(new WishList { WishListId = Guid.NewGuid(), ProductId = productId, UserId = userId });
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveFromWishListAsync(Guid wishListId)
        {
            var item = await _wishRepo.Query().FirstOrDefaultAsync(w => w.WishListId == wishListId);
            if (item == null) return false;

            _wishRepo.Remove(item);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<WishListItemResponseDto>> GetWishListAsync(Guid userId, int pageNumber = 1, int pageSize = 10)
        {
            var query = _wishRepo.Query()
                .Where(w => w.UserId == userId)
                .Join(_productRepo.Query(),
                    w => w.ProductId, p => p.Id,
                    (w, p) => new WishListItemResponseDto
                    {
                        WishListId = w.WishListId,
                        ProductId = p.Id,
                        ProductName = p.ProductName,
                        Slug = p.Slug,
                        Price = p.Price,
                        Image = p.Image
                    });

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pageNumber - 1) * pageSize).Take(pageSize)
                .ToListAsync();

            return new PagedResult<WishListItemResponseDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
    }
}
