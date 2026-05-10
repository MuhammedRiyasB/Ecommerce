using Ecommerce.Application.DTOs.Catalog;
using FluentValidation;

namespace Ecommerce.Application.Validators.Catalog
{
    /// <summary>
    /// Validates product creation/update requests for the men's clothing store.
    /// Ensures all clothing-specific attributes meet business rules.
    /// </summary>
    public class CreateProductValidator : AbstractValidator<CreateProductRequestDto>
    {
        public CreateProductValidator()
        {
            RuleFor(p => p.ProductName)
                .NotEmpty().WithMessage("Product name is required.")
                .MaximumLength(200).WithMessage("Product name must not exceed 200 characters.");

            RuleFor(p => p.Price)
                .GreaterThan(0).WithMessage("Price must be greater than zero.");

            RuleFor(p => p.Discount)
                .GreaterThanOrEqualTo(0).WithMessage("Discount cannot be negative.")
                .LessThanOrEqualTo(p => p.Price).WithMessage("Discount cannot exceed the price.");

            RuleFor(p => p.Quantity)
                .GreaterThanOrEqualTo(0).WithMessage("Quantity cannot be negative.");

            RuleFor(p => p.Size)
                .NotEmpty().WithMessage("Size is required.")
                .MaximumLength(20).WithMessage("Size must not exceed 20 characters.");

            RuleFor(p => p.Color)
                .NotEmpty().WithMessage("Color is required.")
                .MaximumLength(50).WithMessage("Color must not exceed 50 characters.");

            RuleFor(p => p.Material)
                .MaximumLength(100).WithMessage("Material must not exceed 100 characters.")
                .When(p => p.Material != null);

            RuleFor(p => p.Description)
                .NotEmpty().WithMessage("Description is required.")
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");

            RuleFor(p => p.CategoryId)
                .GreaterThan(0).WithMessage("A valid category must be selected.");
        }
    }
}
