using Ecommerce.Application.DTOs.Identity;
using FluentValidation;

namespace Ecommerce.Application.Validators.Identity
{
    public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MinimumLength(3).WithMessage("Name must be at least 3 characters")
                .MaximumLength(20).WithMessage("Name cannot exceed 20 characters");
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .Must(email => email != null && email.EndsWith("@gmail.com", System.StringComparison.OrdinalIgnoreCase))
                .WithMessage("Email must be a @gmail.com address");
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .MaximumLength(20).WithMessage("Password cannot exceed 20 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least 1 Capital letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least 1 small letter")
                .Matches(@"\d").WithMessage("Password must contain at least 1 number")
                .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain at least 1 symbol like @ * . #");
        }
    }
}
