using LoanManagement.Application.Models;

namespace LoanManagement.Application.Interfaces;

public interface ICreditScoreService
{
    Task<CreditScoreResult> GetScoreAsync(string tcNo);
}
