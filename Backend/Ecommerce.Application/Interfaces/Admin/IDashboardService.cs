using Ecommerce.Application.DTOs.Admin;
using Ecommerce.Application.DTOs.Catalog;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Ecommerce.Application.Interfaces.Admin
{
    public interface IDashboardService
    {
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
        Task<List<ProductResponseDto>> GetLowStockProductsAsync(int threshold = 10, int limit = 5);
    }
}
