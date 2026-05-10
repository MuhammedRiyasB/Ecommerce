using Ecommerce.Application.Interfaces.Catalog;
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
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            // Repository & Unit of Work
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped(typeof(IReadRepository<>), typeof(Repository<>));
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // External Services (Infrastructure implementations of Application interfaces)
            services.AddScoped<ICloudImageService, CloudinaryImageService>();
            services.AddScoped<IPaymentGatewayService, StripeGatewayService>();

            return services;
        }
    }
}
