namespace LoanManagement.API.DTOs.Payment;

public record CreatePaymentRequest(
    Guid LoanId,
    decimal Amount,
    string CardNumber,
    string CardHolder,
    string ExpiryDate,
    string Cvv
);
