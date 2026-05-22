using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductVariantsInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductId_SelectedSize_SelectedColor",
                table: "CartItems");

            migrationBuilder.AddColumn<Guid>(
                name: "ProductVariantId",
                table: "OrderItems",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ProductVariantId",
                table: "CartItems",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "ProductVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SKU = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Size = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductVariants_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO ProductVariants (Id, ProductId, SKU, Size, Color, Quantity, CreatedAtUtc, UpdatedAtUtc)
                SELECT NEWID(), p.Id, p.SKU, p.Size, p.Color, p.Quantity, SYSUTCDATETIME(), NULL
                FROM Products p
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM ProductVariants pv
                    WHERE pv.ProductId = p.Id
                );

                UPDATE ci
                SET ProductVariantId = pv.Id
                FROM CartItems ci
                INNER JOIN Products p
                    ON p.Id = ci.ProductId
                INNER JOIN ProductVariants pv
                    ON pv.ProductId = ci.ProductId
                    AND pv.Size = COALESCE(NULLIF(ci.SelectedSize, ''), p.Size)
                    AND pv.Color = COALESCE(NULLIF(ci.SelectedColor, ''), p.Color);

                UPDATE oi
                SET ProductVariantId = pv.Id
                FROM OrderItems oi
                INNER JOIN Products p
                    ON p.Id = oi.ProductId
                INNER JOIN ProductVariants pv
                    ON pv.ProductId = oi.ProductId
                    AND pv.Size = COALESCE(NULLIF(oi.SelectedSize, ''), p.Size)
                    AND pv.Color = COALESCE(NULLIF(oi.SelectedColor, ''), p.Color);
                """);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductVariantId",
                table: "OrderItems",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductVariantId",
                table: "CartItems",
                columns: new[] { "CartId", "ProductVariantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_ProductVariantId",
                table: "CartItems",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_ProductId_Size_Color",
                table: "ProductVariants",
                columns: new[] { "ProductId", "Size", "Color" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_SKU",
                table: "ProductVariants",
                column: "SKU",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_ProductVariants_ProductVariantId",
                table: "CartItems",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_ProductVariants_ProductVariantId",
                table: "OrderItems",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_ProductVariants_ProductVariantId",
                table: "CartItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_ProductVariants_ProductVariantId",
                table: "OrderItems");

            migrationBuilder.DropTable(
                name: "ProductVariants");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_ProductVariantId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_CartId_ProductVariantId",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_ProductVariantId",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "ProductVariantId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ProductVariantId",
                table: "CartItems");

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_CartId_ProductId_SelectedSize_SelectedColor",
                table: "CartItems",
                columns: new[] { "CartId", "ProductId", "SelectedSize", "SelectedColor" },
                unique: true);
        }
    }
}
