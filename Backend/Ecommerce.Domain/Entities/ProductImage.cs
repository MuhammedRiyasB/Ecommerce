namespace Ecommerce.Domain.Entities
{
    /// <summary>
    /// Stores one uploaded image in the product gallery.
    /// </summary>
    public class ProductImage
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public int DisplayOrder { get; set; }
        public bool IsPrimary { get; set; }

        public Product Product { get; set; } = null!;
    }
}
