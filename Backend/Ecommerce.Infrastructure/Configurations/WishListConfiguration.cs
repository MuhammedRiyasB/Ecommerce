using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Configurations
{
    public class WishListConfiguration : IEntityTypeConfiguration<WishList>
    {
        public void Configure(EntityTypeBuilder<WishList> builder)
        {
            builder.HasKey(w => w.WishListId);
            builder.HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();
            builder.HasOne(w => w.User).WithMany().HasForeignKey(w => w.UserId);
            builder.HasOne(w => w.Product).WithMany().HasForeignKey(w => w.ProductId);
        }
    }
}
