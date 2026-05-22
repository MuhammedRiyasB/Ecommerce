using Ecommerce.Application.DTOs.Category;
using Ecommerce.Application.DTOs.Identity;
using Ecommerce.Application.Interfaces.Catalog;
using Ecommerce.Application.Interfaces.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Admin
{
    /// <summary>
    /// Admin operations — user management and category management endpoints.
    /// All endpoints require Admin role unless explicitly marked [AllowAnonymous].
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;
        private readonly ICategoryService _categoryService;

        public AdminController(IUserManagementService userManagementService, ICategoryService categoryService)
        {
            _userManagementService = userManagementService;
            _categoryService = categoryService;
        }

        // ==================== User Management ====================

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
            => Ok(await _userManagementService.GetAllUsersAsync(pageNumber, pageSize));

        [HttpPatch("users/block-unblock/{userId}")]
        public async Task<IActionResult> ToggleUserBlockStatus(Guid userId)
        {
            var isBlocked = await _userManagementService.ToggleUserBlockStatusAsync(userId);
            return Ok(new { message = isBlocked ? "User blocked" : "User unblocked" });
        }

        // ==================== Category Management ====================

        /// <summary>
        /// Creates a new category. Set ParentCategoryId to create a subcategory.
        /// </summary>
        [HttpPost("categories")]
        public async Task<IActionResult> AddCategory([FromBody] CreateCategoryRequestDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Category data is required." });
            var message = await _categoryService.CreateCategoryAsync(dto);
            return Ok(new { message });
        }

        /// <summary>
        /// Returns all categories as a flat list (for admin dropdowns).
        /// </summary>
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllCategories()
            => Ok(await _categoryService.GetAllCategoriesAsync());

        /// <summary>
        /// Returns the complete category hierarchy as a nested tree.
        /// Used by the storefront for navigation menus.
        /// </summary>
        [HttpGet("categories/tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryTree()
            => Ok(await _categoryService.GetCategoryTreeAsync());

        /// <summary>
        /// Returns a specific category by its URL-friendly slug.
        /// Includes immediate subcategories in the response.
        /// </summary>
        [HttpGet("categories/slug/{*slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryBySlug(string slug)
        {
            var category = await _categoryService.GetCategoryBySlugAsync(slug);
            return category == null
                ? NotFound(new { message = $"Category with slug '{slug}' not found." })
                : Ok(category);
        }

        /// <summary>
        /// Returns immediate subcategories of a parent category.
        /// </summary>
        [HttpGet("categories/{parentId}/subcategories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSubCategories(int parentId)
            => Ok(await _categoryService.GetSubCategoriesAsync(parentId));

        /// <summary>
        /// Toggles a category's active/inactive status.
        /// Inactive categories are hidden from storefront navigation.
        /// </summary>
        [HttpPatch("categories/{categoryId}/toggle-status")]
        public async Task<IActionResult> ToggleCategoryStatus(int categoryId)
        {
            var isActive = await _categoryService.ToggleCategoryStatusAsync(categoryId);
            return Ok(new { message = isActive ? "Category activated" : "Category deactivated", isActive });
        }

        /// <summary>
        /// Deletes a category. Hard delete.
        /// Fails if category has subcategories or products.
        /// </summary>
        [HttpDelete("categories/{categoryId}")]
        public async Task<IActionResult> DeleteCategory(int categoryId)
        {
            try
            {
                await _categoryService.DeleteCategoryAsync(categoryId);
                return Ok(new { message = "Category deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
