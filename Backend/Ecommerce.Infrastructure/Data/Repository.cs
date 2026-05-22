using Ecommerce.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Data
{
    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly AppDbContext _context;
        private readonly DbSet<T> _dbSet;

        public Repository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        // IReadRepository<T> methods
        public IQueryable<T> Query() => _dbSet;
        public async Task<T?> GetByIdAsync(Guid id) => await _dbSet.FindAsync(id);
        public async Task<List<T>> GetAllAsync() => await _dbSet.ToListAsync();

        // IRepository<T> write methods
        public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);
        public void Update(T entity) => _dbSet.Update(entity);
        public void Remove(T entity) => _dbSet.Remove(entity);
        public void RemoveRange(IEnumerable<T> entities) => _dbSet.RemoveRange(entities);
    }
}
