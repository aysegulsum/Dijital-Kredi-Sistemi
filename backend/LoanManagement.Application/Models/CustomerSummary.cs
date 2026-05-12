namespace LoanManagement.Application.Models;

public class CustomerSummary
{
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalDebt { get; set; }
    public decimal RemainingPrincipal { get; set; }
    public int OverdueInstallmentCount { get; set; }
    public int PaidInstallmentCount { get; set; }
    public int UnpaidInstallmentCount { get; set; }
    public int ActiveLoanCount { get; set; }
}
