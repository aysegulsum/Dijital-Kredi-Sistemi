using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class PaymentResult
{
    public Payment Payment { get; set; } = null!;
    public List<AllocationDetail> Allocations { get; set; } = [];
}

public class AllocationDetail
{
    public int InstallmentNo { get; set; }
    public decimal AllocatedAmount { get; set; }
    public decimal InstallmentRemaining { get; set; }
    public InstallmentStatus Status { get; set; }
}

public class PaymentService(
    IPaymentRepository paymentRepo,
    IInstallmentRepository installmentRepo,
    ILoanRepository loanRepo,
    IPaymentGateway paymentGateway)
{
    public async Task<Payment?> GetByIdAsync(Guid id)
        => await paymentRepo.GetByIdAsync(id);

    public async Task<IEnumerable<Payment>> GetByLoanIdAsync(Guid loanId)
        => await paymentRepo.GetByLoanIdAsync(loanId);

    public async Task<PaymentResult> ProcessAsync(Guid loanId, decimal amountPaid,
        string cardNumber = "", string cardHolder = "", string expiryDate = "", string cvv = "")
    {
        var loan = await loanRepo.GetByIdAsync(loanId);
        if (loan is null) throw new NotFoundException(nameof(Loan), loanId);
        if (loan.Status == LoanStatus.Closed)
            throw new ConflictException("Bu kredi zaten kapatilmistir.");

        var installments = (await installmentRepo.GetByLoanIdAsync(loanId))
            .OrderBy(i => i.InstallmentNo)
            .ToList();

        var unpaid = installments
            .Where(i => i.Status != InstallmentStatus.Paid)
            .ToList();

        if (unpaid.Count == 0)
            throw new ConflictException("Tum taksitler zaten odenmistir.");

        var gatewayResult = await paymentGateway.ProcessAsync(new PaymentGatewayRequest
        {
            LoanId = loanId,
            Amount = amountPaid,
            CardNumber = cardNumber,
            CardHolder = cardHolder,
            ExpiryDate = expiryDate,
            Cvv = cvv
        });

        if (!gatewayResult.Success)
            throw new PaymentFailedException(gatewayResult.FailureReason ?? "Odeme reddedildi.");

        var payment = new Payment
        {
            Id            = Guid.NewGuid(),
            LoanId        = loanId,
            InstallmentId = unpaid[0].Id,
            AmountPaid    = amountPaid,
            PaidAt        = DateTime.UtcNow,
            PaymentRef    = gatewayResult.ReferenceCode,
            GatewayStatus = GatewayStatus.Success
        };

        var allocations = AllocatePayment(unpaid, amountPaid);

        foreach (var inst in unpaid)
            installmentRepo.Update(inst);

        await paymentRepo.AddAsync(payment);

        if (installments.All(i => i.Status == InstallmentStatus.Paid))
        {
            loan.Status = LoanStatus.Closed;
            loanRepo.Update(loan);
        }

        await paymentRepo.SaveChangesAsync();

        return new PaymentResult
        {
            Payment = payment,
            Allocations = allocations
        };
    }

    private static List<AllocationDetail> AllocatePayment(
        List<Installment> unpaidInstallments, decimal amount)
    {
        var allocations = new List<AllocationDetail>();
        var remaining = amount;

        foreach (var inst in unpaidInstallments)
        {
            if (remaining <= 0) break;

            var needed = inst.Amount - inst.PaidAmount;
            var allocated = Math.Min(remaining, needed);

            inst.PaidAmount += allocated;
            remaining -= allocated;

            if (inst.PaidAmount >= inst.Amount)
                inst.Status = InstallmentStatus.Paid;

            allocations.Add(new AllocationDetail
            {
                InstallmentNo        = inst.InstallmentNo,
                AllocatedAmount      = allocated,
                InstallmentRemaining = Math.Max(0, inst.Amount - inst.PaidAmount),
                Status               = inst.Status
            });
        }

        return allocations;
    }
}
