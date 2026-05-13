using LoanManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LoanManagement.Infrastructure.Data.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(c => c.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.LastName).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Phone).HasMaxLength(20);
        builder.Property(c => c.TcNo).IsRequired().HasMaxLength(11);
        builder.Property(c => c.Balance).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(c => c.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(c => c.Email).IsUnique();
        builder.HasIndex(c => c.TcNo).IsUnique();

        // Soft-delete filter handled in repository queries to avoid EF join warnings
        builder.HasMany(c => c.Loans)
               .WithOne(l => l.Customer)
               .HasForeignKey(l => l.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
