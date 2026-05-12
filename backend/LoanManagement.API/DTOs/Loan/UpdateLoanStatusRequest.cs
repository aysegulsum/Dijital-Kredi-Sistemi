using LoanManagement.Domain.Enums;

namespace LoanManagement.API.DTOs.Loan;

public record UpdateLoanStatusRequest(LoanStatus Status);
