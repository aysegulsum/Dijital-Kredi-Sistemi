using FluentValidation;
using LoanManagement.API.DTOs.Payment;

namespace LoanManagement.API.Validators;

public class CreatePaymentValidator : AbstractValidator<CreatePaymentRequest>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.LoanId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}
