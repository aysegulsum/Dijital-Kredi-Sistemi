using LoanManagement.Domain.Enums;

namespace LoanManagement.Domain.Entities;

public class Loan
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public LoanType LoanType { get; set; }
    public decimal Principal { get; set; }
    public decimal InterestRate { get; set; }
    public int TermMonths { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal MonthlyPayment { get; set; }
    public DateOnly StartDate { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Active;
    public int? CreditScore { get; set; }
    public DateTime CreatedAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public ICollection<Installment> Installments { get; set; } = new List<Installment>();
}
