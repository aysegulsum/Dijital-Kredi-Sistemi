using LoanManagement.Domain.Enums;

namespace LoanManagement.Domain.Entities;

public class Installment
{
    public Guid Id { get; set; }
    public Guid LoanId { get; set; }
    public int InstallmentNo { get; set; }
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateOnly DueDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Pending;
    public DateTime CreatedAt { get; set; }

    public decimal RemainingAmount => Amount - PaidAmount;

    public Loan Loan { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
