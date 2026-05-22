namespace Ecommerce.Domain.Interfaces
{
    /// <summary>
    /// Full repository with read and write capabilities.
    /// Extends IReadRepository to inherit all query methods.
    /// </summary>
    public interface IRepository<T> : IReadRepository<T> where T : class
    {
        Task AddAsync(T entity);
        void Update(T entity);
        void Remove(T entity);
        void RemoveRange(IEnumerable<T> entities);
    }
}
