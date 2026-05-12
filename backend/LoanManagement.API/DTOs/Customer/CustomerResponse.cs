namespace LoanManagement.API.DTOs.Customer;

public record CustomerResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string TcNo,
    DateOnly BirthDate,
    string? Phone,
    string? Address,
    DateTime CreatedAt
);
