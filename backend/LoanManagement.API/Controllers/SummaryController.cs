using LoanManagement.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace LoanManagement.API.Controllers;

[ApiController]
[Route("api/customers/{customerId:guid}/summary")]
public class SummaryController(SummaryService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSummary(Guid customerId)
    {
        var summary = await service.GetSummaryAsync(customerId);
        return Ok(summary);
    }
}
