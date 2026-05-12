using LoanManagement.Domain.Entities;

namespace LoanManagement.Application.Interfaces;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(Guid id);
    Task<IEnumerable<Customer>> GetAllAsync();
    Task<bool> EmailExistsAsync(string email, Guid? excludeId = null);
    Task<bool> TcNoExistsAsync(string tcNo, Guid? excludeId = null);
    Task AddAsync(Customer customer);
    void Update(Customer customer);
    Task SaveChangesAsync();
}
