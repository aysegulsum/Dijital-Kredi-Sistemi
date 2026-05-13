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
        var customers = new List<Customer>
        {
            new() { Id = Guid.NewGuid(), FirstName = "Ahmet",   LastName = "Yilmaz",  Email = "ahmet.yilmaz@mail.com",  TcNo = "12345678905", Phone = "05301234567", BirthDate = new DateOnly(1985, 3, 15) },
            new() { Id = Guid.NewGuid(), FirstName = "Fatma",   LastName = "Kaya",    Email = "fatma.kaya@mail.com",    TcNo = "23456789016", Phone = "05321234568", BirthDate = new DateOnly(1990, 7, 22) },
            new() { Id = Guid.NewGuid(), FirstName = "Mehmet",  LastName = "Demir",   Email = "mehmet.demir@mail.com",  TcNo = "34567890127", Phone = "05341234569", BirthDate = new DateOnly(1978, 11, 3) },
            new() { Id = Guid.NewGuid(), FirstName = "Ayse",    LastName = "Celik",   Email = "ayse.celik@mail.com",    TcNo = "45678901238", Phone = "05361234570", BirthDate = new DateOnly(1995, 1, 28) },
            new() { Id = Guid.NewGuid(), FirstName = "Mustafa", LastName = "Sahin",   Email = "mustafa.sahin@mail.com", TcNo = "56789012349", Phone = "05381234571", BirthDate = new DateOnly(1982, 6, 10) },
            new() { Id = Guid.NewGuid(), FirstName = "Zeynep",  LastName = "Ozturk",  Email = "zeynep.ozturk@mail.com", TcNo = "67890123456", Phone = "05401234572", BirthDate = new DateOnly(1998, 9, 5)  },
        };

        await db.Customers.AddRangeAsync(customers);

        // ── Krediler + Taksitler ──────────────────────────────────────────────
        var loans = new List<Loan>();
        var installments = new List<Installment>();
        var payments = new List<Payment>();

        // 1. Ahmet — Aktif ihtiyaç kredisi, 4 taksit ödenmiş
        var loan1 = MakeLoan(customers[0].Id, LoanType.Ihtiyac, 20000m, 0.02m, 12,
                             new DateOnly(2025, 6, 1), 580, LoanStatus.Active);
        var insts1 = MakeInstallments(loan1);
        PayInstallments(insts1, payments, 4); // ilk 4 ödendi
        loans.Add(loan1); installments.AddRange(insts1);

        // 2. Ahmet — Kapalı eğitim kredisi (tamamen ödenmiş)
        var loan2 = MakeLoan(customers[0].Id, LoanType.Egitim, 15000m, 0.015m, 6,
                             new DateOnly(2024, 1, 1), 580, LoanStatus.Closed);
        var insts2 = MakeInstallments(loan2);
        PayInstallments(insts2, payments, 6);
        loans.Add(loan2); installments.AddRange(insts2);

        // 3. Fatma — Aktif taşıt kredisi, hiç ödeme yapılmamış
        var loan3 = MakeLoan(customers[1].Id, LoanType.Tasit, 50000m, 0.025m, 24,
                             new DateOnly(2025, 10, 1), 630, LoanStatus.Active);
        loans.Add(loan3); installments.AddRange(MakeInstallments(loan3));

        // 4. Mehmet — Aktif ihtiyaç kredisi, 2 taksit gecikmiş
        var loan4 = MakeLoan(customers[2].Id, LoanType.Ihtiyac, 30000m, 0.018m, 18,
                             new DateOnly(2025, 1, 1), 685, LoanStatus.Active);
        var insts4 = MakeInstallments(loan4);
        MarkOverdue(insts4, 2); // ilk 2 taksit gecikmiş
        loans.Add(loan4); installments.AddRange(insts4);

        // 5. Ayse — Aktif eğitim kredisi, 1 taksit ödenmiş
        var loan5 = MakeLoan(customers[3].Id, LoanType.Egitim, 10000m, 0.02m, 12,
                             new DateOnly(2025, 9, 1), 740, LoanStatus.Active);
        var insts5 = MakeInstallments(loan5);
        PayInstallments(insts5, payments, 1);
        loans.Add(loan5); installments.AddRange(insts5);

        // 6. Mustafa — İki aktif kredi (ihtiyaç + taşıt)
        var loan6 = MakeLoan(customers[4].Id, LoanType.Ihtiyac, 8000m, 0.02m, 6,
                             new DateOnly(2025, 11, 1), 795, LoanStatus.Active);
        loans.Add(loan6); installments.AddRange(MakeInstallments(loan6));

        var loan7 = MakeLoan(customers[4].Id, LoanType.Tasit, 120000m, 0.022m, 36,
                             new DateOnly(2025, 8, 1), 795, LoanStatus.Active);
        var insts7 = MakeInstallments(loan7);
        PayInstallments(insts7, payments, 3);
        loans.Add(loan7); installments.AddRange(insts7);

        // 7. Zeynep — Kapalı eğitim kredisi
        var loan8 = MakeLoan(customers[5].Id, LoanType.Egitim, 5000m, 0.015m, 3,
                             new DateOnly(2024, 6, 1), 520, LoanStatus.Closed);
        var insts8 = MakeInstallments(loan8);
        PayInstallments(insts8, payments, 3);
        loans.Add(loan8); installments.AddRange(insts8);

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
            CreatedAt      = DateTime.UtcNow,
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
                CreatedAt     = DateTime.UtcNow,
            });
        }
        return list;
    }

    private static void PayInstallments(
        List<Installment> installments, List<Payment> payments, int count)
    {
        foreach (var inst in installments.Take(count))
        {
            inst.Status = InstallmentStatus.Paid;
            payments.Add(new Payment
            {
                Id            = Guid.NewGuid(),
                InstallmentId = inst.Id,
                AmountPaid    = inst.Amount,
                PaidAt        = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30)),
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
