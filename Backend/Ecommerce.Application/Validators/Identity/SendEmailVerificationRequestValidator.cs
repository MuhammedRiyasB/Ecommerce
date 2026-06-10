using Ecommerce.Application.DTOs.Identity;
using FluentValidation;

namespace Ecommerce.Application.Validators.Identity
{
    public class SendEmailVerificationRequestValidator : AbstractValidator<SendEmailVerificationRequestDto>
    {
        public SendEmailVerificationRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Invalid email format.");
        }
    }
}
