using LoanManagement.Domain.Entities;
using LoanManagement.Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace LoanManagement.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new CustomerConfiguration());
        modelBuilder.ApplyConfiguration(new LoanConfiguration());
        modelBuilder.ApplyConfiguration(new InstallmentConfiguration());
        modelBuilder.ApplyConfiguration(new PaymentConfiguration());
    }
}
