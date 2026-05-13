using LoanManagement.Application.Models;

namespace LoanManagement.Application.Interfaces;

/// <summary>
/// KKB/Findeks benzeri kredi bürosu sorgularını simüle eden mock servis.
/// Gerçek entegrasyonda bu interface'in implementasyonu HTTP istemcisiyle swap edilir;
/// uygulama katmanındaki hiçbir kod değişmez.
/// </summary>
public interface IMockCreditBureauService
{
    /// <summary>
    /// Yeni müşteri kaydı sırasında TC kimlik numarasına göre başlangıç puanı döner.
    /// Gerçek KKB sorgusunu simüle eder.
    /// </summary>
    int QueryInitialScore(string tcNo);

    /// <summary>
    /// Müşterinin sistemdeki ödeme geçmişine dayanarak güncel puanı hesaplar.
    /// Bankanın periyodik iç skorlamasını simüle eder.
    /// </summary>
    CreditScoreResult RecalculateScore(string tcNo, CreditScoreInput input);
}
