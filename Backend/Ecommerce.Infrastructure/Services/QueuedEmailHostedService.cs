using Ecommerce.Application.Interfaces.Email;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Infrastructure.Services
{
    /// <summary>
    /// Sends queued transactional emails with lightweight retries.
    /// </summary>
    public sealed class QueuedEmailHostedService : BackgroundService
    {
        private const int MaxAttempts = 3;
        private readonly BackgroundEmailJobQueue _queue;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<QueuedEmailHostedService> _logger;

        public QueuedEmailHostedService(
            BackgroundEmailJobQueue queue,
            IServiceScopeFactory scopeFactory,
            ILogger<QueuedEmailHostedService> logger)
        {
            _queue = queue;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await foreach (var message in _queue.ReadAllAsync(stoppingToken))
            {
                await SendWithRetryAsync(message, stoppingToken);
            }
        }

        private async Task SendWithRetryAsync(EmailJobMessage message, CancellationToken cancellationToken)
        {
            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                    await emailSender.SendAsync(message.ToEmail, message.Subject, message.HtmlBody);
                    _logger.LogInformation("Queued email sent to {Recipient} with subject {Subject}", message.ToEmail, message.Subject);
                    return;
                }
                catch (Exception ex) when (attempt < MaxAttempts)
                {
                    _logger.LogWarning(ex, "Queued email attempt {Attempt} failed for {Recipient}", attempt, message.ToEmail);
                    await Task.Delay(TimeSpan.FromSeconds(2 * attempt), cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Queued email failed permanently for {Recipient}", message.ToEmail);
                }
            }
        }
    }
}
