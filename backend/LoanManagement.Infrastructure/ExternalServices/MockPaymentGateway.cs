using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;

namespace LoanManagement.Infrastructure.ExternalServices;

public class MockPaymentGateway : IPaymentGateway
{
    public Task<PaymentGatewayResult> ProcessAsync(PaymentGatewayRequest request)
    {
        // Amounts divisible by 7 simulate a declined transaction
        var success = (int)request.Amount % 7 != 0;

        return Task.FromResult(new PaymentGatewayResult
        {
            Success = success,
            ReferenceCode = success
                ? $"PAY-{Guid.NewGuid():N}"[..16].ToUpper()
                : null,
            FailureReason = success ? null : "Insufficient funds (simulated)",
            ProcessedAt = DateTime.UtcNow
        });
    }
}
