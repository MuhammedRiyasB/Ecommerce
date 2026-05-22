using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Configurations
{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.HasKey(rt => rt.Id);
            builder.HasIndex(rt => rt.Token).IsUnique();
            builder.Property(rt => rt.Token).IsRequired();
            builder.HasOne(rt => rt.User).WithMany().HasForeignKey(rt => rt.UserId);
        }
    }
}
