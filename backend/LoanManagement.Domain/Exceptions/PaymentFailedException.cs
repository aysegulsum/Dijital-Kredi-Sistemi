namespace LoanManagement.Domain.Exceptions;

public class PaymentFailedException : AppException
{
    public PaymentFailedException(string reason)
        : base($"Payment gateway rejected the transaction: {reason}", 402) { }
}
