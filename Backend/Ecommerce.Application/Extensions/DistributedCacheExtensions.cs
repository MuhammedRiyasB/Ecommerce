using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace Ecommerce.Application.Extensions
{
    public static class DistributedCacheExtensions
    {
        public static async Task SetRecordAsync<T>(
            this IDistributedCache cache,
            string recordId,
            T data,
            TimeSpan? absoluteExpireTime = null,
            TimeSpan? unusedExpireTime = null)
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = absoluteExpireTime ?? TimeSpan.FromSeconds(60),
                SlidingExpiration = unusedExpireTime
            };

            var jsonData = JsonSerializer.Serialize(data);
            try
            {
                await cache.SetStringAsync(recordId, jsonData, options);
            }
            catch (Exception)
            {
                // Fallback: Ignore cache set failure if Redis is down
            }
        }

        public static async Task<T?> GetRecordAsync<T>(this IDistributedCache cache, string recordId)
        {
            try
            {
                var jsonData = await cache.GetStringAsync(recordId);

                if (jsonData is null)
                {
                    return default;
                }

                return JsonSerializer.Deserialize<T>(jsonData);
            }
            catch (Exception)
            {
                // Fallback: If cache fails, treat as cache miss
                return default;
            }
        }
    }
}
