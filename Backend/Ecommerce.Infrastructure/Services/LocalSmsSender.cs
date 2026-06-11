using Ecommerce.Application.Interfaces.Sms;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Infrastructure.Services
{
    public class LocalSmsSender : ISmsSender
    {
        private readonly ILogger<LocalSmsSender> _logger;

        public LocalSmsSender(ILogger<LocalSmsSender> logger)
        {
            _logger = logger;
        }

        public Task SendSmsAsync(string to, string message)
        {
            _logger.LogWarning("[Local SMS Mock] SMS to {PhoneNumber}: {Message}", to, message);
            return Task.CompletedTask;
        }
    }
}
