using Ecommerce.Application.DTOs.Payment;
using FluentValidation;

namespace Ecommerce.Application.Validators.Payment
{
    public class CreatePaymentIntentRequestValidator : AbstractValidator<CreatePaymentIntentRequestDto>
    {
        public CreatePaymentIntentRequestValidator()
        {
            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Payment amount must be greater than zero.")
                .LessThanOrEqualTo(500000).WithMessage("Payment amount exceeds the allowed limit.")
                .PrecisionScale(18, 2, false).WithMessage("Payment amount can have a maximum of two decimal places.");
        }
    }

    public class VerifyPaymentRequestValidator : AbstractValidator<VerifyPaymentRequestDto>
    {
        public VerifyPaymentRequestValidator()
        {
            RuleFor(x => x.PaymentIntentId)
                .NotEmpty().WithMessage("PaymentIntentId is required.")
                .MaximumLength(100).WithMessage("PaymentIntentId must be under 100 characters.")
                .Matches(@"^pi_[A-Za-z0-9_]+$").WithMessage("PaymentIntentId format is invalid.");
        }
    }
}
