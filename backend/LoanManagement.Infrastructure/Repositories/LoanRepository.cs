using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LoanManagement.Infrastructure.Repositories;

public class LoanRepository(AppDbContext db) : ILoanRepository
{
    public async Task<Loan?> GetByIdAsync(Guid id)
        => await db.Loans
            .Include(l => l.Installments)
            .FirstOrDefaultAsync(l => l.Id == id);

    public async Task<IEnumerable<Loan>> GetAllAsync()
        => await db.Loans.Include(l => l.Customer).ToListAsync();

    public async Task<IEnumerable<Loan>> GetByCustomerIdAsync(Guid customerId)
        => await db.Loans
            .Where(l => l.CustomerId == customerId)
            .Include(l => l.Installments)
            .ToListAsync();

    public async Task AddAsync(Loan loan)
        => await db.Loans.AddAsync(loan);

    public void Update(Loan loan)
        => db.Loans.Update(loan);

    public async Task SaveChangesAsync()
        => await db.SaveChangesAsync();
}
