namespace LoanManagement.API.DTOs.Customer;

public record CreateCustomerRequest(
    string FirstName,
    string LastName,
    string Email,
    string TcNo,
    DateOnly BirthDate,
    string? Phone,
    string? Address
);
