using LoanManagement.API.DTOs.Installment;
using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Loan;

public record LoanDetailResponse(
    Guid Id,
    Guid CustomerId,
    LoanType LoanType,
    decimal Principal,
    decimal InterestRate,
    int TermMonths,
    decimal TotalAmount,
    decimal MonthlyPayment,
    DateOnly StartDate,
    LoanStatus Status,
    int? CreditScore,
    DateTime CreatedAt,
    IEnumerable<InstallmentResponse> Installments
);
