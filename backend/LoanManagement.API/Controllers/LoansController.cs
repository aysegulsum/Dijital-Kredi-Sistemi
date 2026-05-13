using LoanManagement.API.DTOs.Installment;
using LoanManagement.API.DTOs.Loan;
using LoanManagement.Application.Services;
using LoanManagement.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace LoanManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoansController(LoanService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var loans = await service.GetAllAsync();
        return Ok(loans.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var loan = await service.GetByIdAsync(id);
        return Ok(ToDetailResponse(loan));
    }

    [HttpGet("by-customer/{customerId:guid}")]
    public async Task<IActionResult> GetByCustomer(Guid customerId)
    {
        var loans = await service.GetByCustomerIdAsync(customerId);
        return Ok(loans.Select(ToDetailResponse));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLoanRequest request)
    {
        var loan = new Loan
        {
            CustomerId   = request.CustomerId,
            LoanType     = request.LoanType,
            Principal    = request.Principal,
            InterestRate = request.InterestRate,
            TermMonths   = request.TermMonths,
            StartDate    = request.StartDate
        };

        var created = await service.CreateAsync(loan);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDetailResponse(created));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLoanRequest request)
    {
        var loan = await service.UpdateAsync(id, request.LoanType);
        return Ok(ToDetailResponse(loan));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateLoanStatusRequest request)
    {
        await service.UpdateStatusAsync(id, request.Status);
        return NoContent();
    }

    private static LoanResponse ToResponse(Loan l) =>
        new(l.Id, l.CustomerId, l.LoanType, l.Principal, l.InterestRate,
            l.TermMonths, l.TotalAmount, l.MonthlyPayment,
            l.StartDate, l.Status, l.CreditScore, l.CreatedAt);

    private static LoanDetailResponse ToDetailResponse(Loan l) =>
        new(l.Id, l.CustomerId, l.LoanType, l.Principal, l.InterestRate,
            l.TermMonths, l.TotalAmount, l.MonthlyPayment,
            l.StartDate, l.Status, l.CreditScore, l.CreatedAt,
            l.Installments.Select(ToInstallmentResponse));

    private static InstallmentResponse ToInstallmentResponse(Installment i) =>
        new(i.Id, i.LoanId, i.InstallmentNo, i.Amount, i.PaidAmount,
            i.Amount - i.PaidAmount, i.DueDate, i.Status,
            i.Payments.Select(p => new PaymentInfo(
                p.Id, p.AmountPaid, p.PaidAt, p.PaymentRef)).ToList());
}
