using FluentValidation;
using Ecommerce.Application.DTOs.Identity;

namespace Ecommerce.Application.Validators.Identity
{
    public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequestDto>
    {
        public ResetPasswordRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Please provide a valid email address.");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Verification code is required.")
                .Length(6).WithMessage("Verification code must be 6 digits.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("New password is required.")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
                .MaximumLength(20).WithMessage("Password cannot exceed 20 characters.")
                .Matches("[A-Z]").WithMessage("Password must contain at least 1 Capital letter")
                .Matches("[a-z]").WithMessage("Password must contain at least 1 small letter")
                .Matches("[0-9]").WithMessage("Password must contain at least 1 number")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least 1 symbol like @ * . #");
        }
    }
}
