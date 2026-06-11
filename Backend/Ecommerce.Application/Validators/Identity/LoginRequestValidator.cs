using Ecommerce.Application.DTOs.Identity;
using FluentValidation;

namespace Ecommerce.Application.Validators.Identity
{
    public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .Must(email => email != null && email.EndsWith("@gmail.com", System.StringComparison.OrdinalIgnoreCase))
                .WithMessage("Email must be a @gmail.com address");
            RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(20);
        }
    }
}
