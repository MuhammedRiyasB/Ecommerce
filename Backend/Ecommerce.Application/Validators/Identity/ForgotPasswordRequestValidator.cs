using FluentValidation;
using Ecommerce.Application.DTOs.Identity;

namespace Ecommerce.Application.Validators.Identity
{
    /// <summary>
    /// Validates the "forgot password" request. Only requires a valid email address.
    /// We deliberately keep this minimal to avoid leaking whether an account exists.
    /// </summary>
    public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequestDto>
    {
        public ForgotPasswordRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Please provide a valid email address.")
                .MaximumLength(100).WithMessage("Email cannot exceed 100 characters.");
        }
    }
}
