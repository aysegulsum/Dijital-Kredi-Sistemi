namespace LoanManagement.Application.Models.External;

public class PaymentGatewayResult
{
    public bool Success { get; set; }
    public string? ReferenceCode { get; set; }
    public string? FailureReason { get; set; }
    public DateTime ProcessedAt { get; set; }
}
