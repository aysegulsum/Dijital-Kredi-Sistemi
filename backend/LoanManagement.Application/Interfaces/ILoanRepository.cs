using LoanManagement.Domain.Entities;

namespace LoanManagement.Application.Interfaces;

public interface ILoanRepository
{
    Task<Loan?> GetByIdAsync(Guid id);
    Task<IEnumerable<Loan>> GetAllAsync();
    Task<IEnumerable<Loan>> GetByCustomerIdAsync(Guid customerId);
    Task AddAsync(Loan loan);
    void Update(Loan loan);
    Task SaveChangesAsync();
}
