using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class CustomerService(
    ICustomerRepository repo,
    ILoanRepository loanRepo,
    IMockCreditBureauService creditBureau)
{
    public async Task<IEnumerable<Customer>> GetAllAsync()
        => await repo.GetAllAsync();

    private static readonly TimeSpan ScoreStaleness = TimeSpan.FromDays(1);

    public async Task<Customer> GetByIdAsync(Guid id)
    {
        var customer = await repo.GetByIdAsync(id);
        if (customer is null) throw new NotFoundException(nameof(Customer), id);

        if (IsScoreStale(customer))
            await RefreshCreditScoreAsync(customer);

        return customer;
    }

    private bool IsScoreStale(Customer customer)
        => customer.CreditScoreUpdatedAt is null
           || DateTime.UtcNow - customer.CreditScoreUpdatedAt.Value > ScoreStaleness;

    public async Task<Customer> CreateAsync(Customer customer)
    {
        if (await repo.EmailExistsAsync(customer.Email))
            throw new ConflictException($"Email '{customer.Email}' is already registered.");

        if (await repo.TcNoExistsAsync(customer.TcNo))
            throw new ConflictException($"TC No '{customer.TcNo}' is already registered.");

        customer.Id        = Guid.NewGuid();
        customer.CreatedAt = DateTime.UtcNow;
        customer.UpdatedAt = DateTime.UtcNow;

        // Yeni müşteri için KKB mock sorgusundan başlangıç puanı ata
        customer.CreditScore          = creditBureau.QueryInitialScore(customer.TcNo);
        customer.CreditScoreUpdatedAt = DateTime.UtcNow;

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

    public async Task<CreditScoreResult> RecalculateCreditScoreAsync(Guid id)
    {
        var customer = await repo.GetByIdAsync(id)
                       ?? throw new NotFoundException(nameof(Customer), id);
        return await RefreshCreditScoreAsync(customer);
    }

    private async Task<CreditScoreResult> RefreshCreditScoreAsync(Customer customer)
    {
        var loans        = (await loanRepo.GetByCustomerIdAsync(customer.Id)).ToList();
        var installments = loans.SelectMany(l => l.Installments).ToList();

        var input = new CreditScoreInput(
            ActiveLoanCount:         loans.Count(l => l.Status == LoanStatus.Active),
            ClosedLoanCount:         loans.Count(l => l.Status == LoanStatus.Closed),
            PaidInstallmentCount:    installments.Count(i => i.Status == InstallmentStatus.Paid),
            OverdueInstallmentCount: installments.Count(i => i.Status == InstallmentStatus.Overdue),
            TotalInstallmentCount:   installments.Count
        );

        var result = creditBureau.RecalculateScore(customer.TcNo, input);

        customer.CreditScore          = result.Score;
        customer.CreditScoreUpdatedAt = DateTime.UtcNow;
        customer.UpdatedAt            = DateTime.UtcNow;
        repo.Update(customer);
        await repo.SaveChangesAsync();

        return result;
    }
}
