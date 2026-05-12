using FluentValidation;
using LoanManagement.API.DTOs.Customer;

namespace LoanManagement.API.Validators;

public class CreateCustomerValidator : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.TcNo).NotEmpty().Length(11).Matches("^[0-9]+$");
        RuleFor(x => x.BirthDate)
            .LessThan(DateOnly.FromDateTime(DateTime.Today.AddYears(-18)))
            .WithMessage("Customer must be at least 18 years old.");
    }
}
