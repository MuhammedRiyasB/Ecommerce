using System.Threading.Channels;
using Ecommerce.Application.Interfaces.Email;

namespace Ecommerce.Infrastructure.Services
{
    /// <summary>
    /// Bounded in-memory email queue for local and single-instance deployments.
    /// For multi-instance production, replace this with a durable queue such as Azure Service Bus, RabbitMQ, or Hangfire storage.
    /// </summary>
    public sealed class BackgroundEmailJobQueue : IEmailJobQueue
    {
        private readonly Channel<EmailJobMessage> _queue;

        public BackgroundEmailJobQueue()
        {
            _queue = Channel.CreateBounded<EmailJobMessage>(new BoundedChannelOptions(200)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true,
                SingleWriter = false
            });
        }

        public ValueTask QueueAsync(EmailJobMessage message, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(message);

            if (string.IsNullOrWhiteSpace(message.ToEmail))
            {
                throw new ArgumentException("Recipient email is required.", nameof(message));
            }

            return _queue.Writer.WriteAsync(message, cancellationToken);
        }

        internal IAsyncEnumerable<EmailJobMessage> ReadAllAsync(CancellationToken cancellationToken)
            => _queue.Reader.ReadAllAsync(cancellationToken);
    }
}
