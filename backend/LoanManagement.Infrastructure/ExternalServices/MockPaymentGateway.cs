using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;

namespace LoanManagement.Infrastructure.ExternalServices;

public class MockPaymentGateway : IPaymentGateway
{
    public async Task<PaymentGatewayResult> ProcessAsync(PaymentGatewayRequest request)
    {
        await Task.Delay(300);

        var digits = request.CardNumber.Replace(" ", "").Replace("-", "");

        if (digits.Length < 16)
            return Fail("Gecersiz kart numarasi.");

        var parts = request.ExpiryDate.Split('/');
        if (parts.Length != 2
            || !int.TryParse(parts[0], out var month)
            || !int.TryParse(parts[1], out var year)
            || month < 1 || month > 12)
            return Fail("Gecersiz son kullanma tarihi.");

        var expiry = new DateTime(2000 + year, month, DateTime.DaysInMonth(2000 + year, month));
        if (expiry < DateTime.UtcNow)
            return Fail("Kartinizin son kullanma tarihi gecmis.");

        if (digits.StartsWith('6'))
            return Fail("Yetersiz bakiye.");

        if (!digits.StartsWith('4') && !digits.StartsWith('5'))
            return Fail("Desteklenmeyen kart tipi.");

        if (request.Amount > 50_000)
            return Fail("Tek seferde maksimum 50.000 TL odeme yapilabilir.");

        return new PaymentGatewayResult
        {
            Success = true,
            ReferenceCode = $"PAY-{Guid.NewGuid():N}"[..16].ToUpper(),
            ProcessedAt = DateTime.UtcNow
        };
    }

    private static PaymentGatewayResult Fail(string reason) => new()
    {
        Success = false,
        FailureReason = reason,
        ProcessedAt = DateTime.UtcNow
    };
}
