using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Installment;

public record InstallmentResponse(
    Guid Id,
    Guid LoanId,
    int InstallmentNo,
    decimal Amount,
    decimal PaidAmount,
    decimal RemainingAmount,
    DateOnly DueDate,
    InstallmentStatus Status,
    List<PaymentInfo> Payments
);

public record PaymentInfo(Guid PaymentId, decimal AmountPaid, DateTime PaidAt, string? PaymentRef);
