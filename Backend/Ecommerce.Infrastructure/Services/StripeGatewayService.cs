using Ecommerce.Application.Interfaces.Payment;
using Ecommerce.Application.DTOs.Payment;
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
            
            if (string.IsNullOrWhiteSpace(secretKey) ||
                !secretKey.StartsWith("sk_", StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Stripe secret key is missing or invalid.");
            }

            StripeConfiguration.ApiKey = secretKey;
        }

        public async Task<ApiResponse<PaymentIntentResponseDto>> CreatePaymentIntentAsync(decimal amount)
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

                return new ApiResponse<PaymentIntentResponseDto>
                {
                    StatusCode = 200,
                    Message = "Payment Intent created",
                    Data = new PaymentIntentResponseDto
                    {
                        ClientSecret = intent.ClientSecret,
                        PaymentIntentId = intent.Id
                    }
                };
            }
            catch (StripeException ex)
            {
                return new ApiResponse<PaymentIntentResponseDto>
                {
                    StatusCode = 500,
                    Message = $"Stripe error: {ex.StripeError.Message}"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaymentIntentResponseDto>
                {
                    StatusCode = 500,
                    Message = $"Failed to create Stripe payment intent: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<PaymentVerificationResponseDto>> VerifyPaymentAsync(string paymentIntentId)
        {
            try
            {
                var service = new PaymentIntentService();
                PaymentIntent intent = await service.GetAsync(paymentIntentId);
                var isSuccessful = intent.Status == "succeeded";

                if (isSuccessful)
                {
                    return new ApiResponse<PaymentVerificationResponseDto>
                    {
                        StatusCode = 200,
                        Message = "Payment verified successfully",
                        Data = new PaymentVerificationResponseDto
                        {
                            Status = intent.Status,
                            IsSuccessful = true
                        }
                    };
                }
                else
                {
                    return new ApiResponse<PaymentVerificationResponseDto>
                    {
                        StatusCode = 400,
                        Message = $"Payment verification failed. Status: {intent.Status}",
                        Data = new PaymentVerificationResponseDto
                        {
                            Status = intent.Status,
                            IsSuccessful = false
                        }
                    };
                }
            }
            catch (StripeException ex)
            {
                return new ApiResponse<PaymentVerificationResponseDto> { StatusCode = 500, Message = $"Stripe error: {ex.StripeError.Message}" };
            }
            catch (Exception ex)
            {
                return new ApiResponse<PaymentVerificationResponseDto> { StatusCode = 500, Message = $"Verification error: {ex.Message}" };
            }
        }
    }
}
