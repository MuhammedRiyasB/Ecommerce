namespace Ecommerce.Application.DTOs.Catalog
{
    /// <summary>
    /// Lightweight DTO for search suggestion dropdown results.
    /// Contains only the minimal fields needed to render a suggestion row,
    /// avoiding the overhead of the full ProductResponseDto (30+ fields).
    /// </summary>
    public class SearchSuggestionDto
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string Image { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public string CategoryName { get; set; } = null!;
    }
}
