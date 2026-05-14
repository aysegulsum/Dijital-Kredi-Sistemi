using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoanManagement.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Seed verilerinden birinin TC'si zaten varsa tekrar ekleme
        if (await db.Customers.AnyAsync(c => c.TcNo == "12345678905" && c.Email == "ahmet.yilmaz@mail.com")) return;

        // ── Müşteriler ────────────────────────────────────────────────────────
        // TC son hanesi → KKB baz puan: 0→0, 1→250, 2→450, 3→650, 4→850, 5→1000, 6→1200, 7→1400, 8→1600, 9→1850
        var customers = new List<Customer>
        {
            // [0] Ahmet  — TC sonu 5 → 1000 (Orta Riskli) — Düzenli ödeyen, orta bakiye
            new() { Id = Guid.NewGuid(), FirstName = "Ahmet",   LastName = "Yilmaz",   Email = "ahmet.yilmaz@mail.com",   TcNo = "12345678905", Phone = "05301234567", BirthDate = new DateOnly(1985, 3, 15), Balance = 50_000m },
            // [1] Fatma  — TC sonu 6 → 1200 (Az Riskli) — Yeni kredi, hiç ödeme yok
            new() { Id = Guid.NewGuid(), FirstName = "Fatma",   LastName = "Kaya",     Email = "fatma.kaya@mail.com",     TcNo = "23456789016", Phone = "05321234568", BirthDate = new DateOnly(1990, 7, 22), Balance = 120_000m },
            // [2] Mehmet — TC sonu 7 → 1400 (Az Riskli) — Gecikmiş taksitleri var
            new() { Id = Guid.NewGuid(), FirstName = "Mehmet",  LastName = "Demir",    Email = "mehmet.demir@mail.com",   TcNo = "34567890127", Phone = "05341234569", BirthDate = new DateOnly(1978, 11, 3), Balance = 75_000m },
            // [3] Ayse   — TC sonu 8 → 1600 (İyi) — Aktif eğitim kredisi
            new() { Id = Guid.NewGuid(), FirstName = "Ayse",    LastName = "Celik",    Email = "ayse.celik@mail.com",     TcNo = "45678901238", Phone = "05361234570", BirthDate = new DateOnly(1995, 1, 28), Balance = 30_000m },
            // [4] Mustafa — TC sonu 9 → 1850 (Çok İyi) — En yüksek puan, çoklu kredi
            new() { Id = Guid.NewGuid(), FirstName = "Mustafa", LastName = "Sahin",    Email = "mustafa.sahin@mail.com",  TcNo = "56789012349", Phone = "05381234571", BirthDate = new DateOnly(1982, 6, 10), Balance = 200_000m },
            // [5] Zeynep — TC sonu 6 → 1200 (Az Riskli) — Tüm krediler kapalı
            new() { Id = Guid.NewGuid(), FirstName = "Zeynep",  LastName = "Ozturk",   Email = "zeynep.ozturk@mail.com",  TcNo = "67890123456", Phone = "05401234572", BirthDate = new DateOnly(1998, 9, 5),  Balance = 15_000m },
            // [6] Ali    — TC sonu 1 → 250 (En Riskli) — Kredi başvurusu reddedilmeli (< 700)
            new() { Id = Guid.NewGuid(), FirstName = "Ali",     LastName = "Yildiz",   Email = "ali.yildiz@mail.com",     TcNo = "11111111111", Phone = "05421234573", BirthDate = new DateOnly(2000, 4, 12), Balance = 5_000m },
            // [7] Elif   — TC sonu 2 → 450 (En Riskli) — Düşük puan, düşük bakiye
            new() { Id = Guid.NewGuid(), FirstName = "Elif",    LastName = "Aksoy",    Email = "elif.aksoy@mail.com",     TcNo = "22222222222", Phone = "05441234574", BirthDate = new DateOnly(1993, 12, 1), Balance = 2_500m },
            // [8] Hasan  — TC sonu 3 → 650 (En Riskli, sınırda) — 700 altı ama yakın
            new() { Id = Guid.NewGuid(), FirstName = "Hasan",   LastName = "Korkmaz",  Email = "hasan.korkmaz@mail.com",  TcNo = "33333333333", Phone = "05461234575", BirthDate = new DateOnly(1975, 8, 20), Balance = 10_000m },
            // [9] Selin  — TC sonu 0 → 0 (Puanı Yok) — Hiç kredi geçmişi yok, yeni müşteri
            new() { Id = Guid.NewGuid(), FirstName = "Selin",   LastName = "Arslan",   Email = "selin.arslan@mail.com",   TcNo = "99999999990", Phone = "05481234576", BirthDate = new DateOnly(2002, 2, 14), Balance = 8_000m },
        };

        await db.Customers.AddRangeAsync(customers);

        // ── Krediler + Taksitler ──────────────────────────────────────────────
        var loans = new List<Loan>();
        var installments = new List<Installment>();
        var payments = new List<Payment>();

        // 1. Ahmet (1000) — Aktif ihtiyaç kredisi, 4/12 taksit ödenmiş
        var loan1 = MakeLoan(customers[0].Id, LoanType.Ihtiyac, 20000m, 0.02m, 12,
                             new DateOnly(2025, 6, 1), 1000, LoanStatus.Active);
        var insts1 = MakeInstallments(loan1);
        PayInstallments(insts1, payments, 4);
        loans.Add(loan1); installments.AddRange(insts1);

        // 2. Ahmet (1000) — Kapalı eğitim kredisi (tamamen ödenmiş)
        var loan2 = MakeLoan(customers[0].Id, LoanType.Egitim, 15000m, 0.015m, 6,
                             new DateOnly(2024, 1, 1), 1000, LoanStatus.Closed);
        var insts2 = MakeInstallments(loan2);
        PayInstallments(insts2, payments, 6);
        loans.Add(loan2); installments.AddRange(insts2);

        // 3. Fatma (1200) — Aktif taşıt kredisi, hiç ödeme yapılmamış
        var loan3 = MakeLoan(customers[1].Id, LoanType.Tasit, 50000m, 0.025m, 24,
                             new DateOnly(2025, 10, 1), 1200, LoanStatus.Active);
        loans.Add(loan3); installments.AddRange(MakeInstallments(loan3));

        // 4. Mehmet (1400) — Aktif ihtiyaç kredisi, 2 taksit gecikmiş
        var loan4 = MakeLoan(customers[2].Id, LoanType.Ihtiyac, 30000m, 0.018m, 18,
                             new DateOnly(2025, 1, 1), 1400, LoanStatus.Active);
        var insts4 = MakeInstallments(loan4);
        MarkOverdue(insts4, 2);
        loans.Add(loan4); installments.AddRange(insts4);

        // 5. Ayse (1600) — Aktif eğitim kredisi, 1/12 taksit ödenmiş
        var loan5 = MakeLoan(customers[3].Id, LoanType.Egitim, 10000m, 0.02m, 12,
                             new DateOnly(2025, 9, 1), 1600, LoanStatus.Active);
        var insts5 = MakeInstallments(loan5);
        PayInstallments(insts5, payments, 1);
        loans.Add(loan5); installments.AddRange(insts5);

        // 6. Mustafa (1850) — İki aktif kredi (ihtiyaç + taşıt), en yüksek puanlı müşteri
        var loan6 = MakeLoan(customers[4].Id, LoanType.Ihtiyac, 8000m, 0.02m, 6,
                             new DateOnly(2025, 11, 1), 1850, LoanStatus.Active);
        loans.Add(loan6); installments.AddRange(MakeInstallments(loan6));

        var loan7 = MakeLoan(customers[4].Id, LoanType.Tasit, 120000m, 0.022m, 36,
                             new DateOnly(2025, 8, 1), 1850, LoanStatus.Active);
        var insts7 = MakeInstallments(loan7);
        PayInstallments(insts7, payments, 3);
        loans.Add(loan7); installments.AddRange(insts7);

        // 7. Zeynep (1200) — Kapalı eğitim kredisi, tüm borçları bitmiş
        var loan8 = MakeLoan(customers[5].Id, LoanType.Egitim, 5000m, 0.015m, 3,
                             new DateOnly(2024, 6, 1), 1200, LoanStatus.Closed);
        var insts8 = MakeInstallments(loan8);
        PayInstallments(insts8, payments, 3);
        loans.Add(loan8); installments.AddRange(insts8);

        // 8–10: Yeni müşteriler — kredisi yok, farklı puan seviyeleri
        // Ali (250), Elif (450), Hasan (650) → hepsi < 700, başvuru reddedilmeli
        // Selin (0) → hiç geçmişi yok, puan hesaplanamaz

        await db.Loans.AddRangeAsync(loans);
        await db.Installments.AddRangeAsync(installments);
        await db.Payments.AddRangeAsync(payments);
        await db.SaveChangesAsync();
    }

    // ── Yardımcı metodlar ────────────────────────────────────────────────────

    private static Loan MakeLoan(
        Guid customerId, LoanType type, decimal principal,
        decimal rate, int term, DateOnly start, int creditScore, LoanStatus status)
    {
        var total   = Math.Round(principal * (1 + rate * term), 2);
        var monthly = Math.Round(total / term, 2);

        return new Loan
        {
            Id             = Guid.NewGuid(),
            CustomerId     = customerId,
            LoanType       = type,
            Principal      = principal,
            InterestRate   = rate,
            TermMonths     = term,
            TotalAmount    = total,
            MonthlyPayment = monthly,
            StartDate      = start,
            Status         = status,
            CreditScore    = creditScore,
            CreatedAt      = DateTime.Now,
        };
    }

    private static List<Installment> MakeInstallments(Loan loan)
    {
        var list = new List<Installment>();
        for (var i = 1; i <= loan.TermMonths; i++)
        {
            var amount = i < loan.TermMonths
                ? loan.MonthlyPayment
                : loan.TotalAmount - loan.MonthlyPayment * (loan.TermMonths - 1);

            list.Add(new Installment
            {
                Id            = Guid.NewGuid(),
                LoanId        = loan.Id,
                InstallmentNo = i,
                Amount        = Math.Round(amount, 2),
                DueDate       = loan.StartDate.AddMonths(i),
                Status        = InstallmentStatus.Pending,
                CreatedAt     = DateTime.Now,
            });
        }
        return list;
    }

    private static void PayInstallments(
        List<Installment> installments, List<Payment> payments, int count)
    {
        foreach (var inst in installments.Take(count))
        {
            inst.Status     = InstallmentStatus.Paid;
            inst.PaidAmount = inst.Amount;
            payments.Add(new Payment
            {
                Id            = Guid.NewGuid(),
                LoanId        = inst.LoanId,
                InstallmentId = inst.Id,
                AmountPaid    = inst.Amount,
                PaidAt        = DateTime.Now.AddDays(-Random.Shared.Next(1, 30)),
                PaymentRef    = $"PAY-{Guid.NewGuid():N}"[..16].ToUpper(),
                GatewayStatus = GatewayStatus.Success,
            });
        }
    }

    private static void MarkOverdue(List<Installment> installments, int count)
    {
        foreach (var inst in installments.Take(count))
            inst.Status = InstallmentStatus.Overdue;
    }
}
