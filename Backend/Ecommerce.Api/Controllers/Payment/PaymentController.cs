using Ecommerce.Application.DTOs.Payment;
using Ecommerce.Application.Common.Settings;
using Ecommerce.Application.Interfaces.Payment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;

namespace Ecommerce.Api.Controllers.Payment
{
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiController]
    [ApiVersion("1.0")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentGatewayService _paymentGatewayService;
        private readonly StripeSettings _stripeSettings;

        public PaymentController(IPaymentGatewayService paymentGatewayService, IOptions<StripeSettings> stripeSettings)
        {
            _paymentGatewayService = paymentGatewayService;
            _stripeSettings = stripeSettings.Value;
        }

        [HttpGet("config")]
        public IActionResult GetPaymentConfig()
        {
            if (string.IsNullOrWhiteSpace(_stripeSettings.PublishableKey) ||
                !_stripeSettings.PublishableKey.StartsWith("pk_", StringComparison.Ordinal))
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Stripe publishable key is not configured."
                });
            }

            return Ok(new PaymentConfigResponseDto
            {
                PublishableKey = _stripeSettings.PublishableKey
            });
        }

        /// <summary>
        /// Creates a Stripe PaymentIntent for the given amount.
        /// Returns a client_secret which the frontend uses to render Stripe Elements.
        /// </summary>
        [HttpPost("create-intent")]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequestDto request)
        {
            var result = await _paymentGatewayService.CreatePaymentIntentAsync(request.Amount);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Verifies a payment's success via its PaymentIntent ID.
        /// </summary>
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequestDto request)
        {
            var result = await _paymentGatewayService.VerifyPaymentAsync(request.PaymentIntentId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
