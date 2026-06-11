namespace Ecommerce.Application.Interfaces.Sms
{
    public interface ISmsSender
    {
        Task SendSmsAsync(string to, string message);
    }
}
