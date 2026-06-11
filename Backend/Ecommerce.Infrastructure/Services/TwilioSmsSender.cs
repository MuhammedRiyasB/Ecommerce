using Ecommerce.Application.Common.Settings;
using Ecommerce.Application.Interfaces.Sms;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace Ecommerce.Infrastructure.Services
{
    public class TwilioSmsSender : ISmsSender
    {
        private readonly SmsSettings _smsSettings;
        private readonly ILogger<TwilioSmsSender> _logger;

        public TwilioSmsSender(IOptions<SmsSettings> smsSettings, ILogger<TwilioSmsSender> logger)
        {
            _smsSettings = smsSettings.Value;
            _logger = logger;
            TwilioClient.Init(_smsSettings.AccountSid, _smsSettings.AuthToken);
        }

        public async Task SendSmsAsync(string to, string message)
        {
            try
            {
                var messageOptions = new CreateMessageOptions(new PhoneNumber(to))
                {
                    From = new PhoneNumber(_smsSettings.FromNumber),
                    Body = message
                };

                await MessageResource.CreateAsync(messageOptions);
                _logger.LogInformation("SMS sent successfully via Twilio to {PhoneNumber}", MaskPhoneNumber(to));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SMS via Twilio to {PhoneNumber}", MaskPhoneNumber(to));
                throw; // Rethrow to let the application handle the failure
            }
        }

        private static string MaskPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber) || phoneNumber.Length <= 4)
                return "****";
            
            return new string('*', phoneNumber.Length - 4) + phoneNumber[^4..];
        }
    }
}
