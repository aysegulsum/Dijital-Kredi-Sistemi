using LoanManagement.Domain.Enums;

namespace LoanManagement.Domain.Entities;

public class Installment
{
    public Guid Id { get; set; }
    public Guid LoanId { get; set; }
    public int InstallmentNo { get; set; }
    public decimal Amount { get; set; }
    public DateOnly DueDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Pending;
    public DateTime CreatedAt { get; set; }

    public Loan Loan { get; set; } = null!;
    public Payment? Payment { get; set; }
}
