namespace LoanManagement.Application.Models.External;

public class CreditScoreResult
{
    public string TcNo { get; set; } = string.Empty;
    public int Score { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public DateTime QueriedAt { get; set; }
}
