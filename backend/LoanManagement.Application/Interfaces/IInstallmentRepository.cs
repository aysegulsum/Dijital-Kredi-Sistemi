using LoanManagement.Domain.Entities;

namespace LoanManagement.Application.Interfaces;

public interface IInstallmentRepository
{
    Task<Installment?> GetByIdAsync(Guid id);
    Task<IEnumerable<Installment>> GetByLoanIdAsync(Guid loanId);
    Task<IEnumerable<Installment>> GetPendingOverdueAsync();
    Task AddRangeAsync(IEnumerable<Installment> installments);
    void Update(Installment installment);
    void UpdateRange(IEnumerable<Installment> installments);
    Task SaveChangesAsync();
}
