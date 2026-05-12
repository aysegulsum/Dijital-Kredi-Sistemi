namespace LoanManagement.Domain.Exceptions;

public class BusinessValidationException : AppException
{
    public BusinessValidationException(string message) : base(message, 422) { }
}
