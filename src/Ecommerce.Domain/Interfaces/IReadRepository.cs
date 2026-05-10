namespace Ecommerce.Domain.Interfaces
{
    /// <summary>
    /// Read-only repository for querying entities without mutation capabilities.
    /// Follows Interface Segregation Principle — consumers that only read data
    /// do not depend on Add/Update/Remove operations.
    /// </summary>
    public interface IReadRepository<T> where T : class
    {
    
        IQueryable<T> Query();
        Task<T?> GetByIdAsync(Guid id);
        Task<List<T>> GetAllAsync();
    }
}
