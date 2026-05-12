using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LoanManagement.Infrastructure.Repositories;

public class PaymentRepository(AppDbContext db) : IPaymentRepository
{
    public async Task<Payment?> GetByIdAsync(Guid id)
        => await db.Payments
            .Include(p => p.Installment)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IEnumerable<Payment>> GetByLoanIdAsync(Guid loanId)
        => await db.Payments
            .Include(p => p.Installment)
            .Where(p => p.Installment.LoanId == loanId)
            .OrderBy(p => p.Installment.InstallmentNo)
            .ToListAsync();

    public async Task AddAsync(Payment payment)
        => await db.Payments.AddAsync(payment);

    public async Task SaveChangesAsync()
        => await db.SaveChangesAsync();
}
