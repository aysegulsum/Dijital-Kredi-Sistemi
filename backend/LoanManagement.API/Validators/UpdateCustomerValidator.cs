using FluentValidation;
using LoanManagement.API.DTOs.Customer;

namespace LoanManagement.API.Validators;

public class UpdateCustomerValidator : AbstractValidator<UpdateCustomerRequest>
{
    public UpdateCustomerValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
    }
}
