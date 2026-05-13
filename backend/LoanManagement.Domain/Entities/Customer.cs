namespace LoanManagement.Domain.Entities;

public class Customer
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string TcNo { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public string? Address { get; set; }
    public decimal Balance { get; set; }
    public int? CreditScore { get; set; }
    public DateTime? CreditScoreUpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public ICollection<Loan> Loans { get; set; } = new List<Loan>();

    public string FullName => $"{FirstName} {LastName}";
}
