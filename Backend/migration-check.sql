IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [Categories] (
        [CategoryId] int NOT NULL IDENTITY,
        [CategoryName] nvarchar(100) NOT NULL,
        [Slug] nvarchar(200) NOT NULL,
        [Description] nvarchar(500) NULL,
        [ImageUrl] nvarchar(500) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ParentCategoryId] int NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([CategoryId]),
        CONSTRAINT [FK_Categories_Categories_ParentCategoryId] FOREIGN KEY ([ParentCategoryId]) REFERENCES [Categories] ([CategoryId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [Users] (
        [UserId] uniqueidentifier NOT NULL,
        [Name] nvarchar(50) NOT NULL,
        [Email] nvarchar(100) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL DEFAULT N'User',
        [IsBlocked] bit NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([UserId])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [Products] (
        [Id] uniqueidentifier NOT NULL,
        [ProductName] nvarchar(200) NOT NULL,
        [SKU] nvarchar(50) NOT NULL,
        [Slug] nvarchar(250) NOT NULL,
        [Quantity] int NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [Discount] decimal(18,2) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [Image] nvarchar(max) NOT NULL,
        [Size] nvarchar(20) NOT NULL,
        [Color] nvarchar(50) NOT NULL,
        [Material] nvarchar(100) NULL,
        [CategoryId] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([CategoryId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [Addresses] (
        [AddressId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [FullName] nvarchar(100) NOT NULL,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Pincode] nvarchar(10) NOT NULL,
        [HouseName] nvarchar(200) NOT NULL,
        [Place] nvarchar(100) NOT NULL,
        [PostOffice] nvarchar(100) NOT NULL,
        [LandMark] nvarchar(200) NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        CONSTRAINT [PK_Addresses] PRIMARY KEY ([AddressId]),
        CONSTRAINT [FK_Addresses_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [Carts] (
        [CartId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Carts] PRIMARY KEY ([CartId]),
        CONSTRAINT [FK_Carts_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Token] nvarchar(450) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL,
        [TokenFamily] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [WishLists] (
        [WishListId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [ProductId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_WishLists] PRIMARY KEY ([WishListId]),
        CONSTRAINT [FK_WishLists_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_WishLists_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [Orders] (
        [OrderId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [AddressId] uniqueidentifier NOT NULL,
        [TotalPrice] decimal(18,2) NOT NULL,
        [OrderStatus] int NOT NULL,
        [OrderDate] datetime2 NOT NULL,
        [TransactionId] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([OrderId]),
        CONSTRAINT [FK_Orders_Addresses_AddressId] FOREIGN KEY ([AddressId]) REFERENCES [Addresses] ([AddressId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Orders_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [CartItems] (
        [Id] uniqueidentifier NOT NULL,
        [CartId] uniqueidentifier NOT NULL,
        [ProductId] uniqueidentifier NOT NULL,
        [Quantity] int NOT NULL,
        CONSTRAINT [PK_CartItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CartItems_Carts_CartId] FOREIGN KEY ([CartId]) REFERENCES [Carts] ([CartId]) ON DELETE CASCADE,
        CONSTRAINT [FK_CartItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE TABLE [OrderItems] (
        [OrderItemId] uniqueidentifier NOT NULL,
        [OrderId] uniqueidentifier NOT NULL,
        [ProductId] uniqueidentifier NOT NULL,
        [Quantity] int NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [TotalPrice] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_OrderItems] PRIMARY KEY ([OrderItemId]),
        CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([OrderId]) ON DELETE CASCADE,
        CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Addresses_UserId] ON [Addresses] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CartItems_CartId_ProductId] ON [CartItems] ([CartId], [ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_CartItems_ProductId] ON [CartItems] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Carts_UserId] ON [Carts] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Categories_CategoryName_ParentCategoryId] ON [Categories] ([CategoryName], [ParentCategoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Categories_ParentCategoryId] ON [Categories] ([ParentCategoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Categories_Slug] ON [Categories] ([Slug]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId] ON [OrderItems] ([OrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_OrderItems_ProductId] ON [OrderItems] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Orders_AddressId] ON [Orders] ([AddressId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Orders_TransactionId] ON [Orders] ([TransactionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Orders_UserId] ON [Orders] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Products_CategoryId] ON [Products] ([CategoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Products_SKU] ON [Products] ([SKU]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Products_Slug] ON [Products] ([Slug]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_Token] ON [RefreshTokens] ([Token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_WishLists_ProductId] ON [WishLists] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_WishLists_UserId_ProductId] ON [WishLists] ([UserId], [ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260509171307_InitialMigration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260509171307_InitialMigration', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515143503_AddPasswordResetTokenFields'
)
BEGIN
    ALTER TABLE [Users] ADD [PasswordResetTokenExpiresUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515143503_AddPasswordResetTokenFields'
)
BEGIN
    ALTER TABLE [Users] ADD [PasswordResetTokenHash] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260515143503_AddPasswordResetTokenFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260515143503_AddPasswordResetTokenFields', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519173500_AddProductImagesGallery'
)
BEGIN
    CREATE TABLE [ProductImages] (
        [Id] uniqueidentifier NOT NULL,
        [ProductId] uniqueidentifier NOT NULL,
        [ImageUrl] nvarchar(500) NOT NULL,
        [DisplayOrder] int NOT NULL,
        [IsPrimary] bit NOT NULL,
        CONSTRAINT [PK_ProductImages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductImages_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519173500_AddProductImagesGallery'
)
BEGIN
    CREATE INDEX [IX_ProductImages_ProductId_DisplayOrder] ON [ProductImages] ([ProductId], [DisplayOrder]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519173500_AddProductImagesGallery'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519173500_AddProductImagesGallery', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    DROP INDEX [IX_CartItems_CartId_ProductId] ON [CartItems];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [Products] ADD [AvailableColors] nvarchar(500) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [Products] ADD [AvailableSizes] nvarchar(300) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [Products] ADD [DeliverablePincodes] nvarchar(2000) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [OrderItems] ADD [SelectedColor] nvarchar(50) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [OrderItems] ADD [SelectedSize] nvarchar(20) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [CartItems] ADD [SelectedColor] nvarchar(50) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    ALTER TABLE [CartItems] ADD [SelectedSize] nvarchar(20) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CartItems_CartId_ProductId_SelectedSize_SelectedColor] ON [CartItems] ([CartId], [ProductId], [SelectedSize], [SelectedColor]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519194125_AddProductOptionsAndDeliveryRules'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519194125_AddProductOptionsAndDeliveryRules', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    DROP INDEX [IX_CartItems_CartId_ProductId_SelectedSize_SelectedColor] ON [CartItems];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    ALTER TABLE [OrderItems] ADD [ProductVariantId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    ALTER TABLE [CartItems] ADD [ProductVariantId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    CREATE TABLE [ProductVariants] (
        [Id] uniqueidentifier NOT NULL,
        [ProductId] uniqueidentifier NOT NULL,
        [SKU] nvarchar(50) NOT NULL,
        [Size] nvarchar(20) NOT NULL,
        [Color] nvarchar(50) NOT NULL,
        [Quantity] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_ProductVariants] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProductVariants_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    CREATE INDEX [IX_OrderItems_ProductVariantId] ON [OrderItems] ([ProductVariantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CartItems_CartId_ProductVariantId] ON [CartItems] ([CartId], [ProductVariantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    CREATE INDEX [IX_CartItems_ProductVariantId] ON [CartItems] ([ProductVariantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProductVariants_ProductId_Size_Color] ON [ProductVariants] ([ProductId], [Size], [Color]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ProductVariants_SKU] ON [ProductVariants] ([SKU]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    ALTER TABLE [CartItems] ADD CONSTRAINT [FK_CartItems_ProductVariants_ProductVariantId] FOREIGN KEY ([ProductVariantId]) REFERENCES [ProductVariants] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    ALTER TABLE [OrderItems] ADD CONSTRAINT [FK_OrderItems_ProductVariants_ProductVariantId] FOREIGN KEY ([ProductVariantId]) REFERENCES [ProductVariants] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519200804_AddProductVariantsInventory'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519200804_AddProductVariantsInventory', N'8.0.11');
END;
GO

COMMIT;
GO

