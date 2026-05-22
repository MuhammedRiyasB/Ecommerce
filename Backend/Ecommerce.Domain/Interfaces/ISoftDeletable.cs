namespace Ecommerce.Domain.Interfaces
{
    /// <summary>
    /// Marker interface for entities that support soft deletion.
    /// </summary>
    public interface ISoftDeletable
    {
        bool IsDeleted { get; set; }
        DateTime? DeletedAt { get; set; }
    }
}
