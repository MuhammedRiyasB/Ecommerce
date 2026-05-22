using AutoMapper;
using Ecommerce.Application.Common.ProductOptions;
using Ecommerce.Application.DTOs.Cart;
using Ecommerce.Application.Interfaces.Cart;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Application.Services.Cart
{
    public class CartService : ICartService
    {
        private const int MaxQuantity = 10;
        private readonly IRepository<Domain.Entities.Cart> _cartRepo;
        private readonly IRepository<CartItem> _cartItemRepo;
        private readonly IRepository<Product> _productRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<CartService> _logger;

        public CartService(
            IRepository<Domain.Entities.Cart> cartRepo,
            IRepository<CartItem> cartItemRepo,
            IRepository<Product> productRepo,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            ILogger<CartService> logger)
        {
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _productRepo = productRepo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<CartResponseDto> AddToCartAsync(Guid userId, AddToCartRequestDto dto)
        {
            if (userId == Guid.Empty) throw new ArgumentNullException(nameof(userId), "Invalid user id");
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var product = await _productRepo.Query()
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == dto.ProductId);
            if (product == null) throw new ArgumentException("Product not found", nameof(dto.ProductId));

            var variant = product.Variants.FirstOrDefault(v => v.Id == dto.ProductVariantId);
            if (variant == null) throw new ArgumentException("Selected product variant was not found.", nameof(dto.ProductVariantId));

            ValidateSelection(product, dto.DeliveryPincode);

            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .Include(c => c.CartItems).ThenInclude(ci => ci.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Domain.Entities.Cart { CartId = Guid.NewGuid(), UserId = userId };
                await _cartRepo.AddAsync(cart);
            }

            var requestedQuantity = Math.Max(1, dto.Quantity);
            var normalizedPincode = dto.DeliveryPincode.Trim();
            var existing = cart.CartItems.FirstOrDefault(ci => ci.ProductVariantId == dto.ProductVariantId);

            var currentVariantQuantityInCart = cart.CartItems
                .Where(ci => ci.ProductVariantId == dto.ProductVariantId)
                .Sum(ci => ci.Quantity);

            if (currentVariantQuantityInCart + requestedQuantity > variant.Quantity)
            {
                throw new ArgumentException($"Only {variant.Quantity} unit(s) are currently available for this size and color.");
            }

            if (existing == null)
            {
                var newItem = new CartItem
                {
                    Id = Guid.NewGuid(),
                    CartId = cart.CartId,
                    ProductId = dto.ProductId,
                    ProductVariantId = dto.ProductVariantId,
                    Quantity = Math.Min(requestedQuantity, MaxQuantity),
                    SelectedSize = variant.Size,
                    SelectedColor = variant.Color,
                    DeliveryPincode = normalizedPincode
                };
                await _cartItemRepo.AddAsync(newItem);
            }
            else
            {
                existing.Quantity = Math.Min(existing.Quantity + requestedQuantity, MaxQuantity);
                existing.DeliveryPincode = normalizedPincode;
            }

            try
            {
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation(
                    "User {UserId} added product {ProductId} variant {VariantId} ({Size}/{Color}) to cart",
                    userId,
                    dto.ProductId,
                    dto.ProductVariantId,
                    variant.Size,
                    variant.Color);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency exception when saving cart for user {UserId}. CartItem Id: {CartItemId}", userId, existing?.Id);
                throw;
            }

            return await GetUserCartAsync(userId);
        }

        public async Task<CartResponseDto> GetUserCartAsync(Guid userId)
        {
            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .Include(c => c.CartItems).ThenInclude(ci => ci.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                return new CartResponseDto
                {
                    CartId = Guid.Empty,
                    Items = new List<CartItemResponseDto>()
                };
            }

            return _mapper.Map<CartResponseDto>(cart);
        }

        public async Task<bool> RemoveFromCartAsync(Guid userId, Guid cartItemId)
        {
            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return false;

            var item = cart.CartItems.FirstOrDefault(ci => ci.Id == cartItemId);
            if (item == null) return false;

            _cartItemRepo.Remove(item);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IncreaseQuantityAsync(Guid userId, Guid cartItemId, int delta = 1)
        {
            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems).ThenInclude(ci => ci.Product)
                .Include(c => c.CartItems).ThenInclude(ci => ci.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return false;

            var item = cart.CartItems.FirstOrDefault(ci => ci.Id == cartItemId);
            if (item == null || item.Quantity >= MaxQuantity) return false;

            var totalForVariant = cart.CartItems
                .Where(ci => ci.ProductVariantId == item.ProductVariantId)
                .Sum(ci => ci.Quantity);

            if (item.ProductVariant.Quantity < totalForVariant + delta)
            {
                return false;
            }

            item.Quantity = Math.Min(item.Quantity + delta, MaxQuantity);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DecreaseQuantityAsync(Guid userId, Guid cartItemId, int delta = 1)
        {
            var cart = await _cartRepo.Query()
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return false;

            var item = cart.CartItems.FirstOrDefault(ci => ci.Id == cartItemId);
            if (item == null) return false;

            item.Quantity = Math.Max(0, item.Quantity - delta);
            if (item.Quantity == 0)
            {
                _cartItemRepo.Remove(item);
            }

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        private static void ValidateSelection(Product product, string deliveryPincode)
        {
            var deliverablePincodes = ProductOptionParser.ParsePincodeList(product.DeliverablePincodes);
            if (!deliverablePincodes.Contains(deliveryPincode.Trim(), StringComparer.Ordinal))
            {
                throw new ArgumentException("This product cannot be delivered to the selected pincode.");
            }
        }
    }
}
