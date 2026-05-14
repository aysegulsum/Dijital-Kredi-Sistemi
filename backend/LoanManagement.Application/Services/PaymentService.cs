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
    ICustomerRepository customerRepo,
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

        var nextInstallment = installments
            .FirstOrDefault(i => i.Status != InstallmentStatus.Paid);

        if (nextInstallment is null)
            throw new ConflictException("Tum taksitler zaten odenmistir.");

        if (amountPaid < nextInstallment.Amount)
            throw new BusinessValidationException(
                $"Odeme tutari taksit tutarindan dusuk olamaz. Taksit tutari: {nextInstallment.Amount:N2} TL");

        if (amountPaid > nextInstallment.Amount)
            throw new BusinessValidationException(
                $"Odeme tutari taksit tutarindan yuksek olamaz. Taksit tutari: {nextInstallment.Amount:N2} TL");

        var existingPayments = await paymentRepo.GetByInstallmentIdAsync(nextInstallment.Id);
        if (existingPayments.Any())
            throw new ConflictException("Bu taksit icin zaten bir odeme yapilmistir.");

        var customer = await customerRepo.GetByIdAsync(loan.CustomerId);
        if (customer is null) throw new NotFoundException(nameof(Customer), loan.CustomerId);
        if (customer.Balance < amountPaid)
            throw new BusinessValidationException(
                $"Yetersiz bakiye. Mevcut bakiye: {customer.Balance:N2} TL, Taksit tutari: {amountPaid:N2} TL");

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
            InstallmentId = nextInstallment.Id,
            AmountPaid    = amountPaid,
            PaidAt        = DateTime.Now,
            PaymentRef    = gatewayResult.ReferenceCode,
            GatewayStatus = GatewayStatus.Success
        };

        nextInstallment.PaidAmount = nextInstallment.Amount;
        nextInstallment.Status = InstallmentStatus.Paid;
        installmentRepo.Update(nextInstallment);

        customer.Balance -= amountPaid;
        customerRepo.Update(customer);

        await paymentRepo.AddAsync(payment);

        if (installments.All(i => i.Status == InstallmentStatus.Paid || i.Id == nextInstallment.Id))
        {
            loan.Status = LoanStatus.Closed;
            loanRepo.Update(loan);
        }

        await paymentRepo.SaveChangesAsync();

        return new PaymentResult
        {
            Payment = payment,
            Allocations =
            [
                new AllocationDetail
                {
                    InstallmentNo        = nextInstallment.InstallmentNo,
                    AllocatedAmount      = amountPaid,
                    InstallmentRemaining = 0,
                    Status               = InstallmentStatus.Paid
                }
            ]
        };
    }
}
