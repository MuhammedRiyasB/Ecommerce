using AutoMapper;
using Ecommerce.Application.DTOs.Address;
using Ecommerce.Application.DTOs.Cart;
using Ecommerce.Application.DTOs.Catalog;
using Ecommerce.Application.DTOs.Category;
using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Application.DTOs.Orders;
using Ecommerce.Application.DTOs.Wishlist;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;

namespace Ecommerce.Api.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // === User Mapping ===
            CreateMap<RegisterRequestDto, User>()
                 .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.ToLower()))
                 .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                 .ForMember(dest => dest.UserId, opt => opt.Ignore())
                 .ForMember(dest => dest.Role, opt => opt.MapFrom(src => UserRole.User));
            CreateMap<User, UserResponseDto>();
            CreateMap<User, AdminUserResponseDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            // === Product Mapping ===
            // CreateProductRequestDto → Product: maps clothing-specific fields
            // SKU, Slug, and Image are set manually in ProductService (not mapped from DTO)
            CreateMap<CreateProductRequestDto, Product>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.SKU, opt => opt.Ignore())
                .ForMember(dest => dest.Slug, opt => opt.Ignore())
                .ForMember(dest => dest.Image, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAtUtc, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.CartItems, opt => opt.Ignore());

            // Product → ProductResponseDto: includes category name for display
            CreateMap<Product, ProductResponseDto>()
                .ForMember(dest => dest.CategoryName,
                    opt => opt.MapFrom(src => src.Category != null ? src.Category.CategoryName : string.Empty));

            // === Category Mapping ===
            // Category → CategoryResponseDto: includes SubCategories for tree responses
            CreateMap<Category, CategoryResponseDto>();

            // CreateCategoryRequestDto → Category: Slug is set manually in CategoryService
            CreateMap<CreateCategoryRequestDto, Category>()
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.Slug, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(_ => true))
                .ForMember(dest => dest.ParentCategory, opt => opt.Ignore())
                .ForMember(dest => dest.SubCategories, opt => opt.Ignore())
                .ForMember(dest => dest.Products, opt => opt.Ignore());

            // === Address Mapping ===
            CreateMap<Address, AddressResponseDto>().ReverseMap();
            CreateMap<Address, CreateAddressRequestDto>().ReverseMap();

            // === Cart Mapping ===
            CreateMap<CartItem, CartItemResponseDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : string.Empty))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Product != null ? src.Product.Price : 0))
                .ForMember(dest => dest.Image, opt => opt.MapFrom(src => src.Product != null ? src.Product.Image : null))
                .ForMember(dest => dest.Quantity, opt => opt.MapFrom(src => src.Quantity))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => (src.Product != null ? src.Product.Price : 0) * src.Quantity));

            CreateMap<Domain.Entities.Cart, CartResponseDto>()
                .ForMember(dest => dest.CartId, opt => opt.MapFrom(src => src.CartId))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.CartItems))
                .ForMember(dest => dest.TotalCount, opt => opt.MapFrom(src => src.CartItems.Sum(i => i.Quantity)))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.CartItems.Sum(i => (i.Product != null ? i.Product.Price : 0) * i.Quantity)));

            // === Order Mapping ===
            CreateMap<OrderItem, OrderItemResponseDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : string.Empty))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Product != null ? src.Product.Image : string.Empty))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.UnitPrice))
                .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.TotalPrice));

            CreateMap<Order, OrderDetailsResponseDto>()
                .ForMember(dest => dest.OrderStatus, opt => opt.MapFrom(src => src.OrderStatus.ToString()))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address))
                .ForMember(dest => dest.OrderItems, opt => opt.MapFrom(src => src.OrderItems));

            // === Wishlist Mapping ===
            CreateMap<WishList, WishListItemResponseDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.ProductName))
                .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Product.Price))
                .ForMember(dest => dest.Image, opt => opt.MapFrom(src => src.Product.Image));
        }
    }
}
