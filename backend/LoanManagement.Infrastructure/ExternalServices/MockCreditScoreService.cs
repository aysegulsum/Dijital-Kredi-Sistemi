using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;

namespace LoanManagement.Infrastructure.ExternalServices;

public class MockCreditScoreService : ICreditScoreService
{
    public Task<CreditScoreResult> GetScoreAsync(string tcNo)
    {
        // Deterministic: last digit of TC maps to a score range so tests are predictable
        var lastDigit = int.Parse(tcNo[^1].ToString());
        var score = 300 + lastDigit * 55; // 300–795

        return Task.FromResult(new CreditScoreResult
        {
            TcNo = tcNo,
            Score = score,
            RiskLevel = score >= 700 ? "LOW" : score >= 500 ? "MEDIUM" : "HIGH",
            QueriedAt = DateTime.UtcNow
        });
    }
}
