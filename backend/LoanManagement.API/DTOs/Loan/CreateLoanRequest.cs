using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Loan;

public record CreateLoanRequest(
    Guid CustomerId,
    LoanType LoanType,
    decimal Principal,
    decimal InterestRate,
    int TermMonths,
    DateOnly StartDate
);
