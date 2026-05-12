using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LoanManagement.Infrastructure.Repositories;

public class CustomerRepository(AppDbContext db) : ICustomerRepository
{
    public async Task<Customer?> GetByIdAsync(Guid id)
        => await db.Customers.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

    public async Task<IEnumerable<Customer>> GetAllAsync()
        => await db.Customers.Where(c => !c.IsDeleted).ToListAsync();

    public async Task<bool> EmailExistsAsync(string email, Guid? excludeId = null)
        => await db.Customers.AnyAsync(c => c.Email == email && !c.IsDeleted && c.Id != excludeId);

    public async Task<bool> TcNoExistsAsync(string tcNo, Guid? excludeId = null)
        => await db.Customers.AnyAsync(c => c.TcNo == tcNo && !c.IsDeleted && c.Id != excludeId);

    public async Task AddAsync(Customer customer)
        => await db.Customers.AddAsync(customer);

    public void Update(Customer customer)
        => db.Customers.Update(customer);

    public async Task SaveChangesAsync()
        => await db.SaveChangesAsync();
}
