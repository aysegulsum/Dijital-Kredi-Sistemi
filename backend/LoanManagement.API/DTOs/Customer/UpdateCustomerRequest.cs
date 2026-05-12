namespace LoanManagement.API.DTOs.Customer;

public record UpdateCustomerRequest(
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? Address
);
