using LoanManagement.Application.Models;

namespace LoanManagement.Application.Interfaces;

public interface IPaymentGateway
{
    Task<PaymentGatewayResult> ProcessAsync(PaymentGatewayRequest request);
}
