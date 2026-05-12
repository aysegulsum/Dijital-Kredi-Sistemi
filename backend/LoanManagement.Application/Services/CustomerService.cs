using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class CustomerService(ICustomerRepository repo)
{
    public async Task<IEnumerable<Customer>> GetAllAsync()
        => await repo.GetAllAsync();

    public async Task<Customer> GetByIdAsync(Guid id)
    {
        var customer = await repo.GetByIdAsync(id);
        if (customer is null) throw new NotFoundException(nameof(Customer), id);
        return customer;
    }

    public async Task<Customer> CreateAsync(Customer customer)
    {
        if (await repo.EmailExistsAsync(customer.Email))
            throw new ConflictException($"Email '{customer.Email}' is already registered.");

        if (await repo.TcNoExistsAsync(customer.TcNo))
            throw new ConflictException($"TC No '{customer.TcNo}' is already registered.");

        customer.Id        = Guid.NewGuid();
        customer.CreatedAt = DateTime.UtcNow;
        customer.UpdatedAt = DateTime.UtcNow;

        await repo.AddAsync(customer);
        await repo.SaveChangesAsync();
        return customer;
    }

    public async Task<Customer> UpdateAsync(Guid id, Customer updated)
    {
        var customer = await GetByIdAsync(id);

        if (await repo.EmailExistsAsync(updated.Email, id))
            throw new ConflictException($"Email '{updated.Email}' is already in use.");

        customer.FirstName = updated.FirstName;
        customer.LastName  = updated.LastName;
        customer.Email     = updated.Email;
        customer.Phone     = updated.Phone;
        customer.Address   = updated.Address;
        customer.UpdatedAt = DateTime.UtcNow;

        repo.Update(customer);
        await repo.SaveChangesAsync();
        return customer;
    }

    public async Task DeleteAsync(Guid id)
    {
        var customer = await GetByIdAsync(id);
        customer.IsDeleted = true;
        customer.UpdatedAt = DateTime.UtcNow;
        repo.Update(customer);
        await repo.SaveChangesAsync();
    }
}
