using Ecommerce.Application.DTOs.Identity;
using FluentValidation;

namespace Ecommerce.Application.Validators.Identity
{
    public class VerifyPhoneOtpRequestValidator : AbstractValidator<VerifyPhoneOtpRequestDto>
    {
        public VerifyPhoneOtpRequestValidator()
        {
            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Mobile number is required.")
                .Matches(@"^\d{10}$").WithMessage("Mobile number must be 10 digits.");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("OTP is required.")
                .Matches(@"^\d{6}$").WithMessage("OTP must be 6 digits.");

            RuleFor(x => x.Name)
                .MaximumLength(50).WithMessage("Name cannot exceed 50 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Name));

            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("Invalid email format.")
                .When(x => !string.IsNullOrWhiteSpace(x.Email));
        }
    }
}
