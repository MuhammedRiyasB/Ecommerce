using Ecommerce.Application.DTOs.Identity;
using FluentValidation;

namespace Ecommerce.Application.Validators.Identity
{
    public class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequestDto>
    {
        public VerifyOtpRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Email format is invalid.")
                .MaximumLength(256).WithMessage("Email must be under 256 characters.");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Verification code is required.")
                .Matches(@"^\d{6}$").WithMessage("Verification code must be 6 digits.");
        }
    }
}
