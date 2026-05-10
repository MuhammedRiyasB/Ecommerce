using Ecommerce.Application.Interfaces.Payment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace Ecommerce.Api.Controllers.Payment
{
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiController]
    [ApiVersion("1.0")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentGatewayService _paymentGatewayService;
        public PaymentController(IPaymentGatewayService paymentGatewayService) => _paymentGatewayService = paymentGatewayService;

        /// <summary>
        /// Creates a Stripe PaymentIntent for the given amount.
        /// Returns a client_secret which the frontend uses to render Stripe Elements.
        /// </summary>
        [HttpPost("create-intent")]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] decimal amount)
        {
            var result = await _paymentGatewayService.CreatePaymentIntentAsync(amount);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Verifies a payment's success via its PaymentIntent ID.
        /// </summary>
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyPayment([FromBody] string paymentIntentId)
        {
            if (string.IsNullOrWhiteSpace(paymentIntentId))
                return BadRequest(new { message = "PaymentIntentId is required." });

            var result = await _paymentGatewayService.VerifyPaymentAsync(paymentIntentId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
