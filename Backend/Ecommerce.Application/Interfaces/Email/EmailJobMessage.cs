namespace Ecommerce.Application.Interfaces.Email
{
    /// <summary>
    /// Immutable request for a transactional email that should be sent outside the user request.
    /// </summary>
    public sealed record EmailJobMessage(string ToEmail, string Subject, string HtmlBody);
}
