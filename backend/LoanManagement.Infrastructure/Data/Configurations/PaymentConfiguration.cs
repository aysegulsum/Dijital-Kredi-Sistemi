using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LoanManagement.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(p => p.AmountPaid).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.PaymentRef).HasMaxLength(100);
        builder.Property(p => p.PaidAt).HasDefaultValueSql("GETUTCDATE()");

        builder.Property(p => p.GatewayStatus)
               .HasConversion<string>()
               .HasMaxLength(20)
               .HasDefaultValue(GatewayStatus.Success);

        // DB-level uniqueness: one payment per installment
        builder.HasIndex(p => p.InstallmentId).IsUnique();
    }
}
