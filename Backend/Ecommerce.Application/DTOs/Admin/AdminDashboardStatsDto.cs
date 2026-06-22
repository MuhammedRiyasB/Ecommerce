using System;

namespace Ecommerce.Application.DTOs.Admin
{
    public class AdminDashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalItemsDelivered { get; set; }
        public int TotalItemsCancelled { get; set; }
        public int TotalProcessingOrders { get; set; }
        public int TotalShippedOrders { get; set; }
        public int TotalCustomers { get; set; }
        public int LowStockCount { get; set; }
    }
}
