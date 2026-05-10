using Ecommerce.Application.Interfaces.Payment;
using Ecommerce.Domain.Common;
using Microsoft.Extensions.Configuration;
using Stripe;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Ecommerce.Infrastructure.Services
{
    /// <summary>
    /// Stripe implementation of IPaymentGatewayService — infrastructure concern.
    /// Handles communicating with the Stripe API using Stripe.net.
    /// </summary>
    public class StripeGatewayService : IPaymentGatewayService
    {
        public StripeGatewayService(IConfiguration configuration)
        {
            var secretKey = configuration["StripeSettings:SecretKey"];
            
            if (string.IsNullOrEmpty(secretKey))
                throw new InvalidOperationException("Stripe configuration is missing.");

            StripeConfiguration.ApiKey = secretKey;
        }

        public async Task<ApiResponse<string>> CreatePaymentIntentAsync(decimal amount)
        {
            try
            {
                // Stripe expects amounts in the smallest currency unit (e.g., cents or paise)
                long amountInSmallestUnit = (long)(amount * 100);

                var options = new PaymentIntentCreateOptions
                {
                    Amount = amountInSmallestUnit,
                    Currency = "inr", // Assuming INR based on previous Razorpay config. Change if needed.
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                    },
                };

                var service = new PaymentIntentService();
                PaymentIntent intent = await service.CreateAsync(options);

                return new ApiResponse<string>
                {
                    StatusCode = 200,
                    Message = "Payment Intent created",
                    Data = intent.ClientSecret
                };
            }
            catch (StripeException ex)
            {
                return new ApiResponse<string>
                {
                    StatusCode = 500,
                    Message = $"Stripe error: {ex.StripeError.Message}"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>
                {
                    StatusCode = 500,
                    Message = $"Failed to create Stripe payment intent: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> VerifyPaymentAsync(string paymentIntentId)
        {
            try
            {
                var service = new PaymentIntentService();
                PaymentIntent intent = await service.GetAsync(paymentIntentId);

                if (intent.Status == "succeeded")
                {
                    return new ApiResponse<bool> { StatusCode = 200, Message = "Payment verified successfully", Data = true };
                }
                else
                {
                    return new ApiResponse<bool> { StatusCode = 400, Message = $"Payment verification failed. Status: {intent.Status}", Data = false };
                }
            }
            catch (StripeException ex)
            {
                return new ApiResponse<bool> { StatusCode = 500, Message = $"Stripe error: {ex.StripeError.Message}", Data = false };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool> { StatusCode = 500, Message = $"Verification error: {ex.Message}", Data = false };
            }
        }
    }
}
