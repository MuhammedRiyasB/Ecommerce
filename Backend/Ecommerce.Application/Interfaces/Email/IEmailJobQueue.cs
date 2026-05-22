namespace Ecommerce.Application.Interfaces.Email
{
    /// <summary>
    /// Queues transactional emails so checkout and order actions do not wait on SMTP delivery.
    /// </summary>
    public interface IEmailJobQueue
    {
        ValueTask QueueAsync(EmailJobMessage message, CancellationToken cancellationToken = default);
    }
}
