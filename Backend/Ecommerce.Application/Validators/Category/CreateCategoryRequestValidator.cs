using Ecommerce.Application.DTOs.Category;
using FluentValidation;

namespace Ecommerce.Application.Validators.Category
{
    public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequestDto>
    {
        public CreateCategoryRequestValidator()
        {
            RuleFor(x => x.CategoryName).NotEmpty().MaximumLength(50);
        }
    }
}
