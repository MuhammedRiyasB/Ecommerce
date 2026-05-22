namespace Ecommerce.Domain.Common
{
    /// <summary>
    /// Generic API response wrapper with status code, message, and optional data payload.
    /// </summary>
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }
}
