using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Configurations
{
    public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
    {
        public void Configure(EntityTypeBuilder<ProductVariant> builder)
        {
            builder.HasKey(v => v.Id);

            builder.Property(v => v.SKU)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(v => v.Size)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(v => v.Color)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(v => v.SKU).IsUnique();
            builder.HasIndex(v => new { v.ProductId, v.Size, v.Color }).IsUnique();

            builder.HasOne(v => v.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(v => v.ProductId);
        }
    }
}
