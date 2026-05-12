namespace LoanManagement.API.DTOs.Payment;

public record CreatePaymentRequest(Guid InstallmentId, decimal Amount);
