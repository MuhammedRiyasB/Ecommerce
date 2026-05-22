# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Backend/Ecommerce.Api/Ecommerce.Api.csproj", "Backend/Ecommerce.Api/"]
COPY ["Backend/Ecommerce.Application/Ecommerce.Application.csproj", "Backend/Ecommerce.Application/"]
COPY ["Backend/Ecommerce.Domain/Ecommerce.Domain.csproj", "Backend/Ecommerce.Domain/"]
COPY ["Backend/Ecommerce.Infrastructure/Ecommerce.Infrastructure.csproj", "Backend/Ecommerce.Infrastructure/"]
RUN dotnet restore "./Backend/Ecommerce.Api/Ecommerce.Api.csproj"
COPY . .
WORKDIR "/src/Backend/Ecommerce.Api"
RUN dotnet build "./Ecommerce.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Ecommerce.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY ["Frontend/package.json", "Frontend/package-lock.json", "./"]
RUN npm ci
COPY ["Frontend/", "./"]
RUN npm run build

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=frontend-build /frontend/dist ./wwwroot
ENTRYPOINT ["dotnet", "Ecommerce.Api.dll"]
