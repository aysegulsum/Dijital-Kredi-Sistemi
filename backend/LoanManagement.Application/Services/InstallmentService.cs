using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class InstallmentService(IInstallmentRepository repo)
{
    public async Task<Installment> GetByIdAsync(Guid id)
    {
        var installment = await repo.GetByIdAsync(id);
        if (installment is null) throw new NotFoundException(nameof(Installment), id);
        return installment;
    }

    public async Task<IEnumerable<Installment>> GetByLoanIdAsync(Guid loanId)
        => await repo.GetByLoanIdAsync(loanId);

    public async Task<int> MarkOverdueAsync()
    {
        var overdue = (await repo.GetPendingOverdueAsync()).ToList();

        foreach (var inst in overdue)
            inst.Status = InstallmentStatus.Overdue;

        repo.UpdateRange(overdue);
        await repo.SaveChangesAsync();
        return overdue.Count;
    }
}
