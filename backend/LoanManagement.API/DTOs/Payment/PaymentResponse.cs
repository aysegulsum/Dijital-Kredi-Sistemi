using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Payment;

public record PaymentResponse(
    Guid Id,
    Guid LoanId,
    decimal AmountPaid,
    DateTime PaidAt,
    string? PaymentRef,
    GatewayStatus GatewayStatus,
    List<PaymentAllocation> Allocations
);

public record PaymentAllocation(
    int InstallmentNo,
    decimal AllocatedAmount,
    decimal InstallmentRemaining,
    string Status
);
