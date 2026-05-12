using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;
using LoanManagement.Domain.Enums;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class SummaryService(ICustomerRepository customerRepo, ILoanRepository loanRepo)
{
    public async Task<CustomerSummary> GetSummaryAsync(Guid customerId)
    {
        var customer = await customerRepo.GetByIdAsync(customerId);
        if (customer is null) throw new NotFoundException("Customer", customerId);

        var loans           = (await loanRepo.GetByCustomerIdAsync(customerId)).ToList();
        var allInstallments = loans.SelectMany(l => l.Installments).ToList();

        var totalDebt = allInstallments
            .Where(i => i.Status != InstallmentStatus.Paid)
            .Sum(i => i.Amount);

        var remainingPrincipal = loans
            .Where(l => l.Status == LoanStatus.Active)
            .Sum(l =>
            {
                var paidCount = l.Installments.Count(i => i.Status == InstallmentStatus.Paid);
                return l.Principal * (1 - (decimal)paidCount / l.TermMonths);
            });

        return new CustomerSummary
        {
            CustomerId             = customerId,
            CustomerName           = customer.FullName,
            TotalDebt              = Math.Round(totalDebt, 2),
            RemainingPrincipal     = Math.Round(remainingPrincipal, 2),
            OverdueInstallmentCount = allInstallments.Count(i => i.Status == InstallmentStatus.Overdue),
            PaidInstallmentCount   = allInstallments.Count(i => i.Status == InstallmentStatus.Paid),
            UnpaidInstallmentCount = allInstallments.Count(i => i.Status != InstallmentStatus.Paid),
            ActiveLoanCount        = loans.Count(l => l.Status == LoanStatus.Active)
        };
    }
}
