namespace Ecommerce.Application.Interfaces.Email
{
    /// <summary>
    /// Abstraction for sending transactional emails.
    /// Concrete implementation lives in Infrastructure to keep Application layer clean.
    /// </summary>
    public interface IEmailSender
    {
        /// <summary>Sends an email asynchronously.</summary>
        /// <param name="toEmail">Recipient email address.</param>
        /// <param name="subject">Email subject line.</param>
        /// <param name="htmlBody">HTML body content.</param>
        Task SendAsync(string toEmail, string subject, string htmlBody);
    }
}
