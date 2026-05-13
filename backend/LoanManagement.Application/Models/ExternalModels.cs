namespace LoanManagement.Application.Models;

public class CreditScoreResult
{
    public string TcNo { get; set; } = string.Empty;
    public int Score { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public DateTime QueriedAt { get; set; }
    public List<string> Breakdown { get; set; } = [];
}

/// <summary>
/// RecalculateScore çağrısına girdi olarak verilen müşteri ödeme özeti.
/// </summary>
public record CreditScoreInput(
    int ActiveLoanCount,
    int ClosedLoanCount,
    int PaidInstallmentCount,
    int OverdueInstallmentCount,
    int TotalInstallmentCount
);

public class PaymentGatewayRequest
{
    public Guid InstallmentId { get; set; }
    public decimal Amount { get; set; }
}

public class PaymentGatewayResult
{
    public bool Success { get; set; }
    public string? ReferenceCode { get; set; }
    public string? FailureReason { get; set; }
    public DateTime ProcessedAt { get; set; }
}
