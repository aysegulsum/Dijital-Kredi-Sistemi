namespace LoanManagement.Application.Models.External;

public class PaymentGatewayRequest
{
    public Guid InstallmentId { get; set; }
    public decimal Amount { get; set; }
}
