using LoanManagement.Application.Interfaces;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class LoanService(
    ILoanRepository loanRepo,
    IInstallmentRepository installmentRepo,
    ICustomerRepository customerRepo,
    IMockCreditBureauService creditBureau)
{
    /// <summary>
    /// KKB standardına göre minimum kredi puanı (En Riskli grubun üst sınırı + 1).
    /// 700'ün altı otomatik red; 700–1099 arası "gri alan" uyarısıyla onaylanır.
    /// </summary>
    private const int MinCreditScore = 700;

    public async Task<IEnumerable<Loan>> GetAllAsync()
        => await loanRepo.GetAllAsync();

    public async Task<Loan> GetByIdAsync(Guid id)
    {
        var loan = await loanRepo.GetByIdAsync(id);
        if (loan is null) throw new NotFoundException(nameof(Loan), id);
        return loan;
    }

    public async Task<IEnumerable<Loan>> GetByCustomerIdAsync(Guid customerId)
        => await loanRepo.GetByCustomerIdAsync(customerId);

    public async Task<Loan> CreateAsync(Loan loan)
    {
        // 1. Müşteriyi doğrula
        var customer = await customerRepo.GetByIdAsync(loan.CustomerId);
        if (customer is null) throw new NotFoundException(nameof(Customer), loan.CustomerId);

        // 2. Kredi skoru kontrolü: mevcut puan öncelikli, yoksa KKB'den sorgula
        var applicationScore = customer.CreditScore ?? creditBureau.QueryInitialScore(customer.TcNo);
        EnsureCreditEligible(applicationScore);

        // 3. Taksit planını hesapla
        var (totalAmount, monthlyPayment, installments) =
            CalculateInstallments(loan.Principal, loan.InterestRate, loan.TermMonths, loan.StartDate);

        // 4. Loan'ı hazırla
        loan.Id             = Guid.NewGuid();
        loan.TotalAmount    = totalAmount;
        loan.MonthlyPayment = monthlyPayment;
        loan.CreditScore    = applicationScore;
        loan.Status         = LoanStatus.Active;
        loan.CreatedAt      = DateTime.UtcNow;

        // 5. LoanId'yi taksitlere ata
        foreach (var inst in installments)
            inst.LoanId = loan.Id;

        // 6. Kaydet
        await loanRepo.AddAsync(loan);
        await installmentRepo.AddRangeAsync(installments);
        await loanRepo.SaveChangesAsync();

        loan.Installments = installments;
        return loan;
    }

    public async Task<Loan> UpdateAsync(Guid id, LoanType loanType)
    {
        var loan = await GetByIdAsync(id);
        if (loan.Status == LoanStatus.Closed)
            throw new ConflictException("Kapatilmis bir kredi guncellenemez.");
        loan.LoanType = loanType;
        loanRepo.Update(loan);
        await loanRepo.SaveChangesAsync();
        return loan;
    }

    public async Task UpdateStatusAsync(Guid id, LoanStatus status)
    {
        var loan = await GetByIdAsync(id);
        loan.Status = status;
        loanRepo.Update(loan);
        await loanRepo.SaveChangesAsync();
    }

    // ── Private business logic ───────────────────────────────────────────────

    private static void EnsureCreditEligible(int score)
    {
        if (score < MinCreditScore)
            throw new BusinessValidationException(
                $"Kredi skoru yetersiz: {score}. " +
                $"Başvuru için minimum {MinCreditScore} puan gerekmektedir. " +
                $"Mevcut puan 'En Riskli' kategorisinde olduğundan başvuru reddedildi.");
    }

    private static (decimal TotalAmount, decimal MonthlyPayment, List<Installment> Installments)
        CalculateInstallments(decimal principal, decimal interestRate, int termMonths, DateOnly startDate)
    {
        // Flat-rate (düz faiz): total = P × (1 + r × n)
        var totalAmount    = Math.Round(principal * (1 + interestRate * termMonths), 2);
        var monthlyPayment = Math.Round(totalAmount / termMonths, 2);

        var installments = new List<Installment>(termMonths);
        for (var i = 1; i <= termMonths; i++)
        {
            // Son taksit yuvarlama farkını absorbe eder
            var amount = i < termMonths
                ? monthlyPayment
                : totalAmount - monthlyPayment * (termMonths - 1);

            installments.Add(new Installment
            {
                Id             = Guid.NewGuid(),
                InstallmentNo  = i,
                Amount         = Math.Round(amount, 2),
                DueDate        = startDate.AddMonths(i),
                Status         = InstallmentStatus.Pending,
                CreatedAt      = DateTime.UtcNow
            });
        }

        return (totalAmount, monthlyPayment, installments);
    }
}
