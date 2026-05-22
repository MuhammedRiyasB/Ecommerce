using Microsoft.AspNetCore.Http;

namespace Ecommerce.Application.Interfaces.Catalog
{
    /// <summary>
    /// Abstracts cloud image storage operations.
    /// </summary>
    public interface ICloudImageService
    {
        Task<string> UploadImageAsync(IFormFile image);
    }
}
