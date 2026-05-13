namespace LoanManagement.API.DTOs.Customer;

public record CreditScoreResponse(
    int Score,
    string RiskLevel,
    DateTime CalculatedAt,
    List<string> Breakdown
);
