using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LoanManagement.Infrastructure.Data.Configurations;

public class LoanConfiguration : IEntityTypeConfiguration<Loan>
{
    public void Configure(EntityTypeBuilder<Loan> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(l => l.LoanType)
               .HasConversion<string>()
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(l => l.Principal).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(l => l.InterestRate).HasColumnType("decimal(7,6)").IsRequired();
        builder.Property(l => l.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(l => l.MonthlyPayment).HasColumnType("decimal(18,2)").IsRequired();

        builder.Property(l => l.Status)
               .HasConversion<string>()
               .HasMaxLength(20)
               .HasDefaultValue(LoanStatus.Active);

        builder.Property(l => l.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasMany(l => l.Installments)
               .WithOne(i => i.Loan)
               .HasForeignKey(i => i.LoanId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
