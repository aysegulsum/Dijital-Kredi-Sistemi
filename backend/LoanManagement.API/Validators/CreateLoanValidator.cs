using FluentValidation;
using LoanManagement.API.DTOs.Loan;
using LoanManagement.Domain.Enums;

namespace LoanManagement.API.Validators;

public class CreateLoanValidator : AbstractValidator<CreateLoanRequest>
{
    public CreateLoanValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.LoanType).IsInEnum();
        RuleFor(x => x.Principal).InclusiveBetween(1_000m, 5_000_000m);
        RuleFor(x => x.InterestRate).InclusiveBetween(0.001m, 0.10m)
            .WithMessage("Interest rate must be between 0.001 (0.1%) and 0.10 (10%) per month.");
        RuleFor(x => x.TermMonths).InclusiveBetween(3, 120);
        RuleFor(x => x.StartDate)
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today))
            .WithMessage("Start date must be today or in the future.");
    }
}
