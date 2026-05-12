using LoanManagement.API.DTOs.Payment;
using LoanManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace LoanManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController(PaymentService service) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var payment = await service.GetByIdAsync(id);
        if (payment is null) return NotFound();
        return Ok(ToResponse(payment));
    }

    [HttpGet("by-loan/{loanId:guid}")]
    public async Task<IActionResult> GetByLoan(Guid loanId)
    {
        var payments = await service.GetByLoanIdAsync(loanId);
        return Ok(payments.Select(ToResponse));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var payment = await service.ProcessAsync(request.InstallmentId, request.Amount);
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, ToResponse(payment));
    }

    private static PaymentResponse ToResponse(Domain.Entities.Payment p) =>
        new(p.Id, p.InstallmentId, p.AmountPaid, p.PaidAt, p.PaymentRef, p.GatewayStatus);
}
