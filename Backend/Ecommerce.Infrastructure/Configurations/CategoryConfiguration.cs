using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Configurations
{
    /// <summary>
    /// EF Core configuration for the Category entity.
    /// Supports self-referencing hierarchy with composite unique index
    /// to allow duplicate names under different parents (e.g., "Hoodies" under Top Wear and Winter Wear).
    /// </summary>
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.HasKey(c => c.CategoryId);

            // Category name — required, max 100 chars
            builder.Property(c => c.CategoryName)
                .IsRequired()
                .HasMaxLength(100);

            // Slug — URL-friendly identifier, unique across all categories
            builder.Property(c => c.Slug)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Description)
                .HasMaxLength(500);

            builder.Property(c => c.ImageUrl)
                .HasMaxLength(500);

            // Composite unique index: same category name is allowed under different parents
            // (e.g., "Hoodies" under "Top Wear" and "Hoodies" under "Winter Wear")
            builder.HasIndex(c => new { c.CategoryName, c.ParentCategoryId })
                .IsUnique()
                .HasFilter(null);

            // Slug must be globally unique for clean URL routing
            builder.HasIndex(c => c.Slug).IsUnique();

            // Self-referencing hierarchy — Restrict delete to prevent
            // accidental cascading deletion of entire category trees
            builder.HasOne(c => c.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
