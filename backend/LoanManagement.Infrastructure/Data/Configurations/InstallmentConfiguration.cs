using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LoanManagement.Infrastructure.Data.Configurations;

public class InstallmentConfiguration : IEntityTypeConfiguration<Installment>
{
    public void Configure(EntityTypeBuilder<Installment> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(i => i.Amount).HasColumnType("decimal(18,2)").IsRequired();

        builder.Property(i => i.Status)
               .HasConversion<string>()
               .HasMaxLength(20)
               .HasDefaultValue(InstallmentStatus.Pending);

        builder.Property(i => i.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(i => new { i.LoanId, i.InstallmentNo }).IsUnique();

        builder.HasOne(i => i.Payment)
               .WithOne(p => p.Installment)
               .HasForeignKey<Payment>(p => p.InstallmentId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
