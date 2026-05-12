using System.Text.Json;
using LoanManagement.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace LoanManagement.API.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (404, "Not Found"),
            ConflictException => (409, "Conflict"),
            BusinessValidationException => (422, "Unprocessable Entity"),
            PaymentFailedException => (402, "Payment Required"),
            AppException e => (e.StatusCode, "Bad Request"),
            _ => (500, "Internal Server Error")
        };

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = exception.Message,
            Instance = context.Request.Path
        };

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(problem, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
