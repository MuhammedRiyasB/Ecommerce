using Ecommerce.Application.Interfaces.Orders;
using Ecommerce.Domain.Enums;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.HostedServices
{
    public class AutoShipBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoShipBackgroundService> _logger;

        public AutoShipBackgroundService(IServiceProvider serviceProvider, ILogger<AutoShipBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoShipBackgroundService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessAutoShippingAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while executing the auto-ship background process.");
                }

                // Wait 5 minutes before checking again
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }

            _logger.LogInformation("AutoShipBackgroundService is stopping.");
        }

        private async Task ProcessAutoShippingAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

            var thresholdTime = DateTime.UtcNow.AddHours(-1);

            // Fetch orders that are pending or processing and older than 1 hour
            var ordersToShip = await dbContext.Orders
                .Where(o => (o.OrderStatus == OrderStatus.Pending || o.OrderStatus == OrderStatus.Processing)
                            && o.OrderDate <= thresholdTime)
                .ToListAsync(stoppingToken);

            if (ordersToShip.Any())
            {
                _logger.LogInformation($"Found {ordersToShip.Count} orders to auto-ship.");

                foreach (var order in ordersToShip)
                {
                    try
                    {
                        // Use the existing service method to properly trigger emails & history
                        var result = await orderService.ChangeOrderStatusAsync(order.OrderId, "Shipped");
                        if (result.Message.Contains("successfully", StringComparison.OrdinalIgnoreCase))
                        {
                            _logger.LogInformation($"Auto-shipped order {order.OrderId} successfully.");
                        }
                        else
                        {
                            _logger.LogWarning($"Failed to auto-ship order {order.OrderId}: {result.Message}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error auto-shipping order {order.OrderId}");
                    }
                }
            }
        }
    }
}
