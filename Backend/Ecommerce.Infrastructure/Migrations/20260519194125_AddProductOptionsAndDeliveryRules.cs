using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductOptionsAndDeliveryRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductId",
                table: "CartItems");

            migrationBuilder.AddColumn<string>(
                name: "AvailableColors",
                table: "Products",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AvailableSizes",
                table: "Products",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DeliverablePincodes",
                table: "Products",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SelectedColor",
                table: "OrderItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SelectedSize",
                table: "OrderItems",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SelectedColor",
                table: "CartItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SelectedSize",
                table: "CartItems",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductId_SelectedSize_SelectedColor",
                table: "CartItems",
                columns: new[] { "CartId", "ProductId", "SelectedSize", "SelectedColor" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductId_SelectedSize_SelectedColor",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "AvailableColors",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "AvailableSizes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DeliverablePincodes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SelectedColor",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "SelectedSize",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "SelectedColor",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "SelectedSize",
                table: "CartItems");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductId",
                table: "CartItems",
                columns: new[] { "CartId", "ProductId" },
                unique: true);
        }
    }
}
