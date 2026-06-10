using Ecommerce.Application.DTOs.Address;
using FluentValidation;

namespace Ecommerce.Application.Validators.Address
{
    public class CreateAddressRequestValidator : AbstractValidator<CreateAddressRequestDto>
    {
        public CreateAddressRequestValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full name is required")
                .MaximumLength(100)
                .Matches(@"^[A-Za-z][A-Za-z\s.'-]*$").WithMessage("Full name contains invalid characters");
            RuleFor(x => x.PhoneNumber).NotEmpty().Matches(@"^\d{10}$").WithMessage("Phone number must be 10 digits");
            RuleFor(x => x.Pincode).NotEmpty().Matches(@"^\d{6}$").WithMessage("Pincode must be 6 digits");
            RuleFor(x => x.HouseName).NotEmpty().MaximumLength(200);
            RuleFor(x => x.Place)
                .NotEmpty()
                .MaximumLength(100)
                .Matches(@"^[A-Za-z][A-Za-z\s.'-]*$").WithMessage("Place contains invalid characters");
            RuleFor(x => x.PostOffice).NotEmpty().MaximumLength(100);
            RuleFor(x => x.LandMark).NotEmpty().MaximumLength(200);
        }
    }
}
