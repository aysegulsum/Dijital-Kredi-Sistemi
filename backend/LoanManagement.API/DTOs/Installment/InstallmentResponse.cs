using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Installment;

public record InstallmentResponse(
    Guid Id,
    Guid LoanId,
    int InstallmentNo,
    decimal Amount,
    DateOnly DueDate,
    InstallmentStatus Status,
    PaymentInfo? Payment
);

public record PaymentInfo(Guid PaymentId, decimal AmountPaid, DateTime PaidAt, string? PaymentRef);
