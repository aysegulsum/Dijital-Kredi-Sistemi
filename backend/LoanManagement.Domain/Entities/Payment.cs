using LoanManagement.Domain.Enums;

namespace LoanManagement.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid LoanId { get; set; }
    public Guid? InstallmentId { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime PaidAt { get; set; }
    public string? PaymentRef { get; set; }
    public GatewayStatus GatewayStatus { get; set; } = GatewayStatus.Success;

    public Loan Loan { get; set; } = null!;
    public Installment? Installment { get; set; }
}
