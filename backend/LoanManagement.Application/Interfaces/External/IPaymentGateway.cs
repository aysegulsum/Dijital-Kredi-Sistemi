using LoanManagement.Application.Models.External;

namespace LoanManagement.Application.Interfaces.External;

public interface IPaymentGateway
{
    Task<PaymentGatewayResult> ProcessAsync(PaymentGatewayRequest request);
}
