using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Payment;

public record PaymentResponse(
    Guid Id,
    Guid InstallmentId,
    decimal AmountPaid,
    DateTime PaidAt,
    string? PaymentRef,
    GatewayStatus GatewayStatus
);
