using LoanManagement.Application.Interfaces;
using LoanManagement.Application.Models;
using LoanManagement.Domain.Entities;
using LoanManagement.Domain.Enums;
using LoanManagement.Domain.Exceptions;

namespace LoanManagement.Application.Services;

public class PaymentService(
    IPaymentRepository paymentRepo,
    IInstallmentRepository installmentRepo,
    ILoanRepository loanRepo,
    IPaymentGateway paymentGateway)
{
    private const decimal AmountToleranceTl = 1m;

    public async Task<Payment?> GetByIdAsync(Guid id)
        => await paymentRepo.GetByIdAsync(id);

    public async Task<IEnumerable<Payment>> GetByLoanIdAsync(Guid loanId)
        => await paymentRepo.GetByLoanIdAsync(loanId);

    public async Task<Payment> ProcessAsync(Guid installmentId, decimal amountPaid)
    {
        // 1. Taksiti bul
        var installment = await installmentRepo.GetByIdAsync(installmentId);
        if (installment is null) throw new NotFoundException(nameof(Installment), installmentId);

        // 2. Ödeme kurallarını kontrol et
        ValidatePayment(installment, amountPaid);

        // 3. Ödeme gateway'ini çağır
        var gatewayResult = await paymentGateway.ProcessAsync(new PaymentGatewayRequest
        {
            InstallmentId = installmentId,
            Amount        = amountPaid
        });
        var loan = await loanRepo.GetByIdAsync(installment.LoanId);

        if (!gatewayResult.Success)
            throw new PaymentFailedException(gatewayResult.FailureReason ?? "Unknown error");

        // 5. Ödeme kaydını oluştur
        var payment = new Payment
        {
            Id            = Guid.NewGuid(),
            InstallmentId = installmentId,
            AmountPaid    = amountPaid,
            PaidAt        = DateTime.UtcNow,
            PaymentRef    = gatewayResult.ReferenceCode,
            GatewayStatus = GatewayStatus.Success
        };

        // 6. Taksit durumunu güncelle
        installment.Status = InstallmentStatus.Paid;
        installmentRepo.Update(installment);
        await paymentRepo.AddAsync(payment);

        // 7. Tüm taksitler ödendiyse krediyi kapat
        if (loan is not null)
        {
            var allInstallments = await installmentRepo.GetByLoanIdAsync(loan.Id);
            if (IsLoanFullyPaid(allInstallments))
            {
                loan.Status = LoanStatus.Closed;
                loanRepo.Update(loan);
            }
        }

        await paymentRepo.SaveChangesAsync();
        return payment;
    }

    // ── Private business logic ───────────────────────────────────────────────

    private static void ValidatePayment(Installment installment, decimal amountPaid)
    {
        if (installment.Status == InstallmentStatus.Paid)
            throw new ConflictException("This installment has already been paid.");

        if (Math.Abs(installment.Amount - amountPaid) > AmountToleranceTl)
            throw new BusinessValidationException(
                $"Payment amount mismatch. Expected: {installment.Amount:F2} TL, received: {amountPaid:F2} TL.");
    }

    private static bool IsLoanFullyPaid(IEnumerable<Installment> installments)
        => installments.All(i => i.Status == InstallmentStatus.Paid);
}
