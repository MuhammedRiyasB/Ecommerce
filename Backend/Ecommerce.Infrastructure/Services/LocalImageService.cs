using Ecommerce.Application.Interfaces.Catalog;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Ecommerce.Infrastructure.Services
{
    /// <summary>
    /// Saves uploaded images to local disk for development when Cloudinary is not configured.
    /// </summary>
    public class LocalImageService : ICloudImageService
    {
        private readonly IWebHostEnvironment _environment;

        public LocalImageService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> UploadImageAsync(IFormFile image)
        {
            if (image == null || image.Length == 0)
                throw new ArgumentException("File is null or empty.", nameof(image));

            var uploadsRoot = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "products");
            Directory.CreateDirectory(uploadsRoot);

            var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(image.FileName)}";
            var filePath = Path.Combine(uploadsRoot, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await image.CopyToAsync(stream);

            return $"/uploads/products/{fileName}";
        }
    }
}
