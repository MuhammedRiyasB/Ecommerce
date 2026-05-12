namespace MockQueryable.Moq;

/// <summary>
/// Provides a compatibility overload for tests that build async query mocks
/// from IQueryable sources. The installed package exposes BuildMock for
/// enumerable inputs, so the test suite normalizes queryables through ToList().
/// </summary>
public static class MockQueryableCompatibilityExtensions
{
    public static IQueryable<TEntity> BuildMock<TEntity>(this IQueryable<TEntity> source)
        where TEntity : class
    {
        return source.ToList().BuildMock();
    }
}
