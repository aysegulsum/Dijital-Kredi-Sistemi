using LoanManagement.Domain.Entities;

namespace LoanManagement.Application.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id);
    Task<IEnumerable<Payment>> GetByLoanIdAsync(Guid loanId);
    Task AddAsync(Payment payment);
    Task SaveChangesAsync();
}
