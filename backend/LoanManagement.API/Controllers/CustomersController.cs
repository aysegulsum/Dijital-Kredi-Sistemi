using LoanManagement.API.DTOs.Customer;
using LoanManagement.Application.Services;
using LoanManagement.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace LoanManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController(CustomerService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await service.GetAllAsync();
        return Ok(customers.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var customer = await service.GetByIdAsync(id);
        return Ok(ToResponse(customer));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            FirstName = request.FirstName,
            LastName  = request.LastName,
            Email     = request.Email,
            TcNo      = request.TcNo,
            BirthDate = request.BirthDate,
            Phone     = request.Phone,
            Address   = request.Address
        };

        var created = await service.CreateAsync(customer);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToResponse(created));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerRequest request)
    {
        var updated = await service.UpdateAsync(id, new Customer
        {
            FirstName = request.FirstName,
            LastName  = request.LastName,
            Email     = request.Email,
            Phone     = request.Phone,
            Address   = request.Address
        });
        return Ok(ToResponse(updated));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteAsync(id);
        return NoContent();
    }

    private static CustomerResponse ToResponse(Customer c) =>
        new(c.Id, c.FirstName, c.LastName, c.Email, c.TcNo,
            c.BirthDate, c.Phone, c.Address, c.CreatedAt);
}
