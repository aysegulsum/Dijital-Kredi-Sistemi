using LoanManagement.API.DTOs.Installment;
using LoanManagement.Application.Services;
using LoanManagement.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace LoanManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstallmentsController(InstallmentService service) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var inst = await service.GetByIdAsync(id);
        return Ok(ToResponse(inst));
    }

    [HttpGet("by-loan/{loanId:guid}")]
    public async Task<IActionResult> GetByLoan(Guid loanId)
    {
        var installments = await service.GetByLoanIdAsync(loanId);
        return Ok(installments.Select(ToResponse));
    }

    private static InstallmentResponse ToResponse(Installment i) =>
        new(i.Id, i.LoanId, i.InstallmentNo, i.Amount, i.PaidAmount,
            i.Amount - i.PaidAmount, i.DueDate, i.Status,
            i.Payments.Select(p => new PaymentInfo(
                p.Id, p.AmountPaid, p.PaidAt, p.PaymentRef)).ToList());
}
