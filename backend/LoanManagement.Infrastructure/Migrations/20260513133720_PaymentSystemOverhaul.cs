using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoanManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PaymentSystemOverhaul : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Installments_InstallmentId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_InstallmentId",
                table: "Payments");

            // 1. PaidAmount kolonu ekle (default 0)
            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "Installments",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            // Mevcut Paid taksitlerde PaidAmount = Amount olarak guncelle
            migrationBuilder.Sql(
                "UPDATE Installments SET PaidAmount = Amount WHERE Status = 'Paid'");

            // 2. LoanId kolonu nullable olarak ekle
            migrationBuilder.AddColumn<Guid>(
                name: "LoanId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true);

            // Mevcut payment kayitlarinin LoanId'sini Installment uzerinden doldur
            migrationBuilder.Sql(
                @"UPDATE p SET p.LoanId = i.LoanId
                  FROM Payments p
                  INNER JOIN Installments i ON i.Id = p.InstallmentId");

            // Artik LoanId NOT NULL yapilabilir
            migrationBuilder.AlterColumn<Guid>(
                name: "LoanId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            // 3. InstallmentId nullable yap
            migrationBuilder.AlterColumn<Guid>(
                name: "InstallmentId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            // 4. Index ve FK'lari yeniden olustur
            migrationBuilder.CreateIndex(
                name: "IX_Payments_InstallmentId",
                table: "Payments",
                column: "InstallmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_LoanId",
                table: "Payments",
                column: "LoanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Installments_InstallmentId",
                table: "Payments",
                column: "InstallmentId",
                principalTable: "Installments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Loans_LoanId",
                table: "Payments",
                column: "LoanId",
                principalTable: "Loans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Installments_InstallmentId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Loans_LoanId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_InstallmentId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_LoanId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "LoanId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "Installments");

            migrationBuilder.AlterColumn<Guid>(
                name: "InstallmentId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_InstallmentId",
                table: "Payments",
                column: "InstallmentId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Installments_InstallmentId",
                table: "Payments",
                column: "InstallmentId",
                principalTable: "Installments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
