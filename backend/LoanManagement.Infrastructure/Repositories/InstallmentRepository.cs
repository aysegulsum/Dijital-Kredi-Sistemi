using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using LoanManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LoanManagement.Infrastructure.Repositories;

public class InstallmentRepository(AppDbContext db) : IInstallmentRepository
{
    public async Task<Installment?> GetByIdAsync(Guid id)
        => await db.Installments
            .Include(i => i.Payment)
            .FirstOrDefaultAsync(i => i.Id == id);

    public async Task<IEnumerable<Installment>> GetByLoanIdAsync(Guid loanId)
        => await db.Installments
            .Where(i => i.LoanId == loanId)
            .Include(i => i.Payment)
            .OrderBy(i => i.InstallmentNo)
            .ToListAsync();

    public async Task<IEnumerable<Installment>> GetPendingOverdueAsync()
        => await db.Installments
            .Where(i => i.Status == InstallmentStatus.Pending
                     && i.DueDate < DateOnly.FromDateTime(DateTime.UtcNow))
            .ToListAsync();

    public async Task AddRangeAsync(IEnumerable<Installment> installments)
        => await db.Installments.AddRangeAsync(installments);

    public void Update(Installment installment)
        => db.Installments.Update(installment);

    public void UpdateRange(IEnumerable<Installment> installments)
        => db.Installments.UpdateRange(installments);

    public async Task SaveChangesAsync()
        => await db.SaveChangesAsync();
}
