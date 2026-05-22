using Ecommerce.Application.Common.Settings;
using Ecommerce.Application.Interfaces.Catalog;
using Ecommerce.Application.Interfaces.Email;
using Ecommerce.Application.Interfaces.Payment;
using Ecommerce.Domain.Interfaces;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ecommerce.Infrastructure
{
    /// <summary>
    /// Registers all Infrastructure layer services: DbContext, Repository, UoW, and external services.
    /// </summary>
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Database
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqlOptions => sqlOptions.EnableRetryOnFailure()));

            // Repository & Unit of Work
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped(typeof(IReadRepository<>), typeof(Repository<>));
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // External Services (Infrastructure implementations of Application interfaces)
            var cloudinaryCloudName = configuration["CloudinarySettings:CloudName"];
            var cloudinaryApiKey = configuration["CloudinarySettings:ApiKey"];
            var cloudinaryApiSecret = configuration["CloudinarySettings:ApiSecret"];

            if (string.IsNullOrWhiteSpace(cloudinaryCloudName) ||
                cloudinaryCloudName.Contains("SET_VIA_USER_SECRETS_OR_ENV_VAR", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(cloudinaryApiKey) ||
                cloudinaryApiKey.Contains("SET_VIA_USER_SECRETS_OR_ENV_VAR", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(cloudinaryApiSecret) ||
                cloudinaryApiSecret.Contains("SET_VIA_USER_SECRETS_OR_ENV_VAR", StringComparison.OrdinalIgnoreCase))
            {
                services.AddScoped<ICloudImageService, LocalImageService>();
            }
            else
            {
                services.AddScoped<ICloudImageService, CloudinaryImageService>();
            }
            services.AddScoped<IPaymentGatewayService, StripeGatewayService>();

            // Email Service – SMTP via MailKit
            services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
            services.AddScoped<IEmailSender, SmtpEmailSender>();
            services.AddSingleton<BackgroundEmailJobQueue>();
            services.AddSingleton<IEmailJobQueue>(provider => provider.GetRequiredService<BackgroundEmailJobQueue>());
            services.AddHostedService<QueuedEmailHostedService>();

            return services;
        }
    }
}
