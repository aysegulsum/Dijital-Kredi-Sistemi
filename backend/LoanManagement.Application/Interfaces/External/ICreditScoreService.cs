using LoanManagement.Application.Models.External;

namespace LoanManagement.Application.Interfaces.External;

public interface ICreditScoreService
{
    Task<CreditScoreResult> GetScoreAsync(string tcNo);
}
