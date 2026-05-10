using Ecommerce.Application.DTOs.Category;
using FluentValidation;

namespace Ecommerce.Application.Validators.Catalog
{
    /// <summary>
    /// Validates category creation requests.
    /// Ensures category name meets requirements and display order is valid.
    /// </summary>
    public class CreateCategoryValidator : AbstractValidator<CreateCategoryRequestDto>
    {
        public CreateCategoryValidator()
        {
            RuleFor(c => c.CategoryName)
                .NotEmpty().WithMessage("Category name is required.")
                .MaximumLength(100).WithMessage("Category name must not exceed 100 characters.");

            RuleFor(c => c.DisplayOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative.");

            RuleFor(c => c.Description)
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.")
                .When(c => c.Description != null);

            RuleFor(c => c.ImageUrl)
                .MaximumLength(500).WithMessage("Image URL must not exceed 500 characters.")
                .When(c => c.ImageUrl != null);
        }
    }
}
