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
        return Ok(ToSimpleResponse(payment));
    }

    [HttpGet("by-loan/{loanId:guid}")]
    public async Task<IActionResult> GetByLoan(Guid loanId)
    {
        var payments = await service.GetByLoanIdAsync(loanId);
        return Ok(payments.Select(ToSimpleResponse));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        var result = await service.ProcessAsync(
            request.LoanId, request.Amount,
            request.CardNumber, request.CardHolder, request.ExpiryDate, request.Cvv);
        var response = new PaymentResponse(
            result.Payment.Id,
            result.Payment.LoanId,
            result.Payment.AmountPaid,
            result.Payment.PaidAt,
            result.Payment.PaymentRef,
            result.Payment.GatewayStatus,
            result.Allocations.Select(a => new PaymentAllocation(
                a.InstallmentNo,
                a.AllocatedAmount,
                a.InstallmentRemaining,
                a.Status.ToString()
            )).ToList()
        );
        return CreatedAtAction(nameof(GetById), new { id = result.Payment.Id }, response);
    }

    private static PaymentResponse ToSimpleResponse(Domain.Entities.Payment p) =>
        new(p.Id, p.LoanId, p.AmountPaid, p.PaidAt, p.PaymentRef, p.GatewayStatus, []);
}
