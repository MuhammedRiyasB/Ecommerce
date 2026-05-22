using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Ecommerce.Application.Interfaces.Catalog;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Ecommerce.Infrastructure.Services
{
    /// <summary>
    /// Cloudinary implementation of ICloudImageService — infrastructure concern.
    /// </summary>
    public class CloudinaryImageService : ICloudImageService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryImageService(IConfiguration configuration)
        {
            var cloudName = configuration["CloudinarySettings:CloudName"];
            var apiKey = configuration["CloudinarySettings:ApiKey"];
            var apiSecret = configuration["CloudinarySettings:ApiSecret"];

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
                throw new InvalidOperationException("Cloudinary configuration is missing.");

            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is null or empty.", nameof(file));

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "ecommerce_images"
            };
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
                throw new Exception($"Cloudinary upload failed: {uploadResult.Error.Message}");

            return uploadResult.SecureUrl?.ToString() ?? string.Empty;
        }
    }
}
