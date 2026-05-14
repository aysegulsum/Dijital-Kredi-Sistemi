using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;

namespace LoanManagement.Infrastructure.ExternalServices;

/// <summary>
/// KKB/Findeks kredi bürosu mock implementasyonu.
/// İki sorgu modeli:
///   1. QueryInitialScore  — TC son hanesine göre deterministik başlangıç puanı (büro sorgusu)
///   2. RecalculateScore   — Müşterinin ödeme geçmişine dayalı güncel puan (iç skorlama)
/// </summary>
public class MockCreditBureauService : IMockCreditBureauService
{
    // TC kimlik numarasının son hanesine göre KKB başlangıç puanı (0–1900 aralığı)
    private static readonly int[] InitialScoreByLastDigit =
    [
        0,    // 0 → Puanı Yok  (hiç kredi geçmişi yok)
        250,  // 1 → En Riskli
        450,  // 2 → En Riskli
        650,  // 3 → En Riskli
        850,  // 4 → Orta Riskli
        1000, // 5 → Orta Riskli
        1200, // 6 → Az Riskli
        1400, // 7 → Az Riskli
        1600, // 8 → İyi
        1850, // 9 → Çok İyi
    ];

    // Recalculate için sabitler (0–1900 aralığı)
    private const int Base = 1200;
    private const int Min  = 1;
    private const int Max  = 1900;

    // ── Public API ───────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public int QueryInitialScore(string tcNo)
    {
        if (string.IsNullOrWhiteSpace(tcNo) || !char.IsDigit(tcNo[^1]))
            return 0;

        var lastDigit = tcNo[^1] - '0';
        return InitialScoreByLastDigit[lastDigit];
    }

    /// <inheritdoc/>
    public CreditScoreResult RecalculateScore(string tcNo, CreditScoreInput input)
    {
        var (score, breakdown) = Calculate(input);
        return new CreditScoreResult
        {
            TcNo      = tcNo,
            Score     = score,
            RiskLevel = RiskLabel(score),
            QueriedAt = DateTime.Now,
            Breakdown = breakdown
        };
    }

    // ── Hesaplama mantığı ────────────────────────────────────────────────────

    private static (int Score, List<string> Breakdown) Calculate(CreditScoreInput input)
    {
        // Hiç kredi geçmişi yoksa puan hesaplanamaz
        if (input.ActiveLoanCount == 0 && input.ClosedLoanCount == 0)
            return (0, ["Kredi geçmişi yok — puan hesaplanamadı (0)."]);

        var score     = Base;
        var breakdown = new List<string> { $"Baz puan: {Base}" };

        // ── Pozitif faktörler ─────────────────────────────────────────────────

        var paidBonus = input.PaidInstallmentCount switch
        {
            >= 20 => 120,
            >= 10 => 80,
            >= 5  => 40,
            _     => 0
        };
        if (paidBonus > 0)
        {
            score += paidBonus;
            breakdown.Add($"Ödenen taksit ({input.PaidInstallmentCount} adet): +{paidBonus}");
        }

        // Her kapatılmış kredi +50, en fazla 3 kredi sayılır
        var closedBonus = Math.Min(input.ClosedLoanCount, 3) * 50;
        if (closedBonus > 0)
        {
            score += closedBonus;
            breakdown.Add($"Kapatılan kredi ({input.ClosedLoanCount} adet): +{closedBonus}");
        }

        // Hiç gecikme olmamışsa ek puan
        if (input.OverdueInstallmentCount == 0 && input.TotalInstallmentCount > 0)
        {
            score += 100;
            breakdown.Add("Gecikmesiz ödeme geçmişi: +100");
        }

        // ── Negatif faktörler ─────────────────────────────────────────────────

        var activePenalty = input.ActiveLoanCount switch
        {
            >= 5 => -200,
            4    => -120,
            3    => -60,
            _    => 0
        };
        if (activePenalty < 0)
        {
            score += activePenalty;
            breakdown.Add($"Fazla aktif kredi ({input.ActiveLoanCount} adet): {activePenalty}");
        }

        // Gecikmiş taksit sayısına göre ceza
        var overduePenalty = input.OverdueInstallmentCount switch
        {
            >= 11 => -560,
            >= 6  => -400,
            >= 3  => -260,
            >= 1  => -120,
            _     => 0
        };
        if (overduePenalty < 0)
        {
            score += overduePenalty;
            breakdown.Add($"Gecikmiş taksit ({input.OverdueInstallmentCount} adet): {overduePenalty}");
        }

        // Gecikme oranı (gecikmiş / toplam)
        if (input.TotalInstallmentCount > 0)
        {
            var overdueRate = (double)input.OverdueInstallmentCount / input.TotalInstallmentCount;
            var ratePenalty = overdueRate switch
            {
                > 0.50 => -200,
                > 0.30 => -100,
                _      => 0
            };
            if (ratePenalty < 0)
            {
                score += ratePenalty;
                breakdown.Add($"Yüksek gecikme oranı (%{overdueRate * 100:F0}): {ratePenalty}");
            }
        }

        var clamped = Math.Clamp(score, Min, Max);
        if (clamped != score)
            breakdown.Add($"Puan sınırlandırıldı: {score} → {clamped}");

        breakdown.Add($"Sonuç: {clamped} ({RiskLabel(clamped)})");
        return (clamped, breakdown);
    }

    // ── Risk etiketi (KKB standart seviyeleri) ───────────────────────────────

    private static string RiskLabel(int score) => score switch
    {
        0       => "Puanı Yok",
        <= 699  => "En Riskli",
        <= 1099 => "Orta Riskli",
        <= 1499 => "Az Riskli",
        <= 1699 => "İyi",
        _       => "Çok İyi"
    };
}
