namespace Ecommerce.Domain.Interfaces
{
    /// <summary>
    /// Unit of Work pattern — coordinates saving changes and transactions
    /// across multiple repositories.
    /// </summary>
    public interface IUnitOfWork
    {
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync();
        Task CommitAsync();
        Task RollbackAsync();

        /// <summary>
        /// Runs work inside a transaction compatible with EF Core retry execution strategies.
        /// </summary>
        Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default);
    }
}
