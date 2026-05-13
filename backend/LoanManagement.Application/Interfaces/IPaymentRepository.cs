using LoanManagement.Domain.Entities;

namespace LoanManagement.Application.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id);
    Task<IEnumerable<Payment>> GetByLoanIdAsync(Guid loanId);
    Task<IEnumerable<Payment>> GetByInstallmentIdAsync(Guid installmentId);
    Task AddAsync(Payment payment);
    Task SaveChangesAsync();
}
