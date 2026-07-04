<div align="center">

<img src="Frontend/public/logo.jpeg" alt="UrbanIQ" width="100" style="border-radius: 12px;" />

# UrbanIQ

**A production-grade, full-stack e-commerce platform built with Clean Architecture**

[![.NET](https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)](https://aws.amazon.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

[Live Demo](https://urbaniq.ddnsking.com) · [API Swagger](https://urbaniq.ddns.net/swagger) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

<br />

> UrbanIQ is an enterprise-grade e-commerce platform that goes beyond typical CRUD applications. It implements **Clean Architecture**, automated **CI/CD pipelines**, secure **Stripe payment processing**, **Twilio SMS**, **Cloudinary CDN**, and cloud-native **Docker + AWS deployment** — built the way production systems should be.

<br />

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

<br />

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🛒 Customer Experience

- **Product Catalog** — Categories, variants (size/color), image galleries, slugs, and filtering
- **Shopping Cart** — Real-time stock validation on add/update/remove
- **Wishlist** — Save favourite products for later
- **Multi-Address Checkout** — Pincode-based delivery validation
- **Stripe Payments** — Secure card payments + Cash on Delivery
- **Order Tracking** — Full lifecycle: Pending → Processing → Shipped → Delivered
- **Cancellation & Returns** — Auto stock restoration, return/replacement requests, refund lifecycle
- **Email Notifications** — Rich HTML transactional emails (confirmation, status updates, cancellation)
- **SMS Verification** — OTP via Twilio
- **Responsive Design** — Mobile, tablet, and desktop

</td>
<td width="50%" valign="top">

### 🛡️ Admin Dashboard

- **Revenue Analytics** — Real-time revenue, delivered/cancelled items, processing & shipped counts
- **Product Management** — CRUD with multi-image upload (Cloudinary), variant & SKU management
- **Category Management** — Hierarchical tree with image support
- **Order Management** — Filter by status, update through fulfilment pipeline
- **User Management** — View and manage customer accounts
- **Low Stock Alerts** — Auto-surface low-inventory products

</td>
</tr>
</table>

<details>
<summary><b>🔐 Security & Authentication</b></summary>
<br />

| Feature | Implementation |
| :--- | :--- |
| Authentication | JWT access tokens + refresh token rotation |
| Authorization | Role-based (Customer / Admin) |
| Password Security | Secure hashing via ASP.NET Identity patterns |
| Rate Limiting | Global IP-based (100 req/min) + login throttling (5 req/min) |
| Security Headers | X-Frame-Options, X-XSS-Protection, X-Content-Type-Options, Referrer-Policy |
| CORS | Configurable allowed origins |
| Input Validation | FluentValidation on all requests |
| SSL/TLS | Auto-provisioned Let's Encrypt via Certbot |
| OWASP | Protection against SQL Injection, XSS, CSRF, IDOR |

</details>

<br />

## 🛠 Tech Stack

<table>
<tr>
<td valign="top" width="33%">

### Backend

| | Technology |
| :--- | :--- |
| ⚙️ | ASP.NET Core 8 |
| 🗄️ | Entity Framework Core |
| 🛢️ | SQL Server |
| ⚡ | Redis (distributed cache) |
| 📝 | Serilog (structured logging) |
| ✅ | FluentValidation |
| 🔄 | AutoMapper |
| 💳 | Stripe.NET |
| ☁️ | Cloudinary (image CDN) |
| 📱 | Twilio (SMS/OTP) |
| 📧 | MailKit / SMTP |
| 📖 | Swagger / OpenAPI |
| 🔢 | API Versioning |

</td>
<td valign="top" width="33%">

### Frontend

| | Technology |
| :--- | :--- |
| ⚛️ | React 19 |
| 🔷 | TypeScript |
| 🏪 | Redux Toolkit + RTK Query |
| 🎨 | Tailwind CSS 4 |
| 🎬 | Framer Motion |
| 📋 | React Hook Form + Zod |
| 🧭 | React Router v7 |
| 💳 | Stripe Elements |
| 🎯 | Lucide React (icons) |
| 🧪 | Vitest + Testing Library |

</td>
<td valign="top" width="33%">

### DevOps

| | Technology |
| :--- | :--- |
| 🐳 | Docker (multi-stage) |
| 🐙 | Docker Compose |
| 🌐 | Nginx (reverse proxy) |
| 🔒 | Let's Encrypt / Certbot |
| 🔁 | GitHub Actions CI/CD |
| ☁️ | AWS EC2 |
| ▲ | Vercel (frontend) |

</td>
</tr>
</table>

<br />

## 🏗 Architecture

UrbanIQ follows **Clean Architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Ecommerce.Api                          │
│           Controllers · Middleware · Swagger · CORS             │
│          JWT Auth · Rate Limiting · API Versioning              │
│          Health Checks · Response Compression                   │
├─────────────────────────────────────────────────────────────────┤
│                     Ecommerce.Application                      │
│            Services · DTOs · Interfaces · Validators            │
│     Identity · Catalog · Cart · Orders · Wishlist · Admin       │
├─────────────────────────────────────────────────────────────────┤
│                    Ecommerce.Infrastructure                    │
│          DbContext · Repository · UnitOfWork · Migrations       │
│       Stripe · Cloudinary · Twilio · SMTP · Email Queue         │
├─────────────────────────────────────────────────────────────────┤
│                       Ecommerce.Domain                         │
│              Entities · Enums · Interfaces · Common             │
│    User · Product · Order · Cart · Address · Category           │
│         ProductVariant · ProductImage · WishList                │
└─────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>Key Architectural Patterns</b></summary>
<br />

- **Repository + Unit of Work** — Generic `IRepository<T>`, `IReadRepository<T>`, and `IUnitOfWork` with database transaction support
- **Dependency Injection** — Dedicated `DependencyInjection.cs` extension methods per layer for clean service registration
- **Graceful Degradation** — External services (Cloudinary, Twilio, Redis) automatically fall back to local implementations when credentials aren't configured
- **Background Job Processing** — Queued email delivery via `BackgroundEmailJobQueue` + `QueuedEmailHostedService`
- **Auto-Ship Background Service** — Automated order status progression via hosted service
- **Soft Delete** — `ISoftDeletable` interface with EF Core global query filters
- **Audit Fields** — `CreatedAtUtc` / `UpdatedAtUtc` patterns on entities
- **Centralized Exception Handling** — `ExceptionHandlerMiddleware` for consistent API error responses
- **Security Headers Middleware** — Applied globally via `SecurityHeadersMiddleware`
- **Database Seeding** — Auto-seeds admin user and product categories on startup

</details>

<br />

## 📁 Project Structure

<details>
<summary><b>Click to expand full project tree</b></summary>
<br />

```
UrbanIQ/
│
├── Backend/
│   ├── Ecommerce.Api/                      # Presentation layer
│   │   ├── Controllers/
│   │   │   ├── Admin/                      # Dashboard & management endpoints
│   │   │   ├── Cart/                       # Cart CRUD
│   │   │   ├── Catalog/                    # Product & category browsing
│   │   │   ├── Identity/                   # Auth, registration, addresses
│   │   │   ├── Orders/                     # Order placement & tracking
│   │   │   ├── Payment/                    # Stripe payment intents
│   │   │   └── Wishlist/                   # Wishlist management
│   │   ├── HostedServices/                 # Background services (auto-ship)
│   │   ├── Mapping/                        # AutoMapper profiles
│   │   ├── Middleware/                     # Exception & security headers
│   │   └── Program.cs                      # App startup & middleware pipeline
│   │
│   ├── Ecommerce.Application/              # Business logic layer
│   │   ├── DTOs/                           # Request/Response objects
│   │   ├── Interfaces/                     # Service contracts
│   │   ├── Services/
│   │   │   ├── Admin/                      # Dashboard analytics
│   │   │   ├── Cart/                       # Cart operations
│   │   │   ├── Catalog/                    # Product & category logic
│   │   │   ├── Identity/                   # Auth & user management
│   │   │   ├── Orders/                     # Order lifecycle
│   │   │   └── Wishlist/                   # Wishlist logic
│   │   └── Validators/                     # FluentValidation rules
│   │
│   ├── Ecommerce.Domain/                   # Core domain layer
│   │   ├── Entities/                       # User, Product, Order, Cart, etc.
│   │   ├── Enums/                          # OrderStatus, UserRole
│   │   ├── Interfaces/                     # IRepository, IUnitOfWork
│   │   └── Common/                         # PagedResult, shared objects
│   │
│   └── Ecommerce.Infrastructure/           # Data & external services
│       ├── Data/                           # DbContext, Repository, Seeder
│       ├── Configurations/                 # EF Core entity configs
│       ├── Migrations/                     # Database migrations
│       └── Services/                       # Stripe, Cloudinary, Twilio, SMTP
│
├── Frontend/
│   └── src/
│       ├── app/                            # Redux store
│       ├── features/
│       │   ├── admin/                      # Admin dashboard & management
│       │   ├── auth/                       # Login, register, auth state
│       │   ├── cart/                       # Cart page & API slice
│       │   ├── catalog/                    # Product listing & details
│       │   ├── checkout/                   # Checkout, address & payment
│       │   ├── orders/                     # Order history & tracking
│       │   ├── account/                    # User profile & addresses
│       │   └── wishlist/                   # Wishlist page & API slice
│       ├── hooks/                          # Custom React hooks
│       ├── layouts/                        # Layout components
│       └── test/                           # Test setup & utilities
│
├── tests/
│   ├── Ecommerce.UnitTests/                # xUnit unit tests
│   └── Ecommerce.IntegrationTests/         # xUnit integration tests
│
├── nginx/                                  # Nginx reverse proxy config
├── .github/workflows/                      # CI/CD pipeline
├── Dockerfile                              # Multi-stage Docker build
├── docker-compose.yml                      # Production orchestration
└── Ecommerce.sln
```

</details>

<br />

## 🚀 Getting Started

### Prerequisites

- [.NET SDK 8.0+](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [SQL Server 2019+](https://www.microsoft.com/sql-server) (or LocalDB)
- [Redis](https://redis.io/) *(optional — falls back to in-memory cache)*
- [Docker](https://www.docker.com/) *(optional — for containerized deployment)*

### 1️⃣ Clone

```bash
git clone https://github.com/MuhammedRiyasB/Ecommerce.git
cd Ecommerce
```

### 2️⃣ Configure Backend

```bash
cp Backend/Ecommerce.Api/appsettings.Development.example.json Backend/Ecommerce.Api/appsettings.Development.json
```

Open `appsettings.Development.json` and set at minimum:

```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=EcommerceDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "YOUR_SECRET_KEY_MINIMUM_32_CHARACTERS"
  }
}
```

> [!TIP]
> Only the **database connection** and **JWT key** are required. All external services — Cloudinary, Twilio, Redis — gracefully fall back to local implementations when not configured.

### 3️⃣ Run Backend

```bash
dotnet restore Ecommerce.sln
dotnet ef database update --project Backend/Ecommerce.Infrastructure --startup-project Backend/Ecommerce.Api
dotnet run --project Backend/Ecommerce.Api
```

API available at `https://localhost:7078` — Swagger at `/swagger`

### 4️⃣ Run Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

### 5️⃣ Admin Access

The database auto-seeds an admin account using the credentials from `AdminSettings` in your config. Navigate to `/admin-login` to access the dashboard.

<br />

## 🐳 Deployment

### Infrastructure Overview

```
                    ┌──────────────┐
                    │   Vercel     │
   Users ─── ────►  │  (Frontend)  │
                    └──────────────┘
                           │ API calls
                    ┌──────▼──────┐
                    │    Nginx    │
                    │  SSL + Rate │
                    │   Limiting  │
                    └──────┬──────┘
                           │ Reverse Proxy
                    ┌──────▼──────┐
                    │  ASP.NET    │
                    │  Core API   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼────┐ ┌─────▼──────┐
        │SQL Server│ │  Redis  │ │ Cloudinary │
        └──────────┘ └─────────┘ └────────────┘
```

### CI/CD Pipeline

The GitHub Actions workflow automates the full deployment on every push to `main`:

```
Push to main → Build & Test → Docker Build → Push to Hub → SSH Deploy to EC2 → SSL Provision
```

### Docker

```bash
# Local production build
docker compose up -d
```

The compose file orchestrates an **API container** + **Nginx reverse proxy** with auto-provisioned Let's Encrypt SSL.

<br />

## 📡 API Endpoints

> Full interactive documentation available at [`/swagger`](https://urbaniq.ddns.net/swagger)

<details>
<summary><b>Authentication</b></summary>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | Login (returns JWT + refresh token) |
| `POST` | `/api/v1/auth/refresh-token` | Refresh access token |

</details>

<details>
<summary><b>Catalog</b></summary>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Browse products (paginated, filtered) |
| `GET` | `/api/v1/products/{slug}` | Product detail by slug |
| `GET` | `/api/v1/categories` | List all categories |

</details>

<details>
<summary><b>Cart & Wishlist</b></summary>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Get user's cart |
| `POST` | `/api/v1/cart` | Add item to cart |
| `PUT` | `/api/v1/cart` | Update cart item |
| `DELETE` | `/api/v1/cart/{id}` | Remove item from cart |
| `GET` | `/api/v1/wishlist` | Get wishlist |
| `POST` | `/api/v1/wishlist` | Add to wishlist |
| `DELETE` | `/api/v1/wishlist/{id}` | Remove from wishlist |

</details>

<details>
<summary><b>Orders & Payments</b></summary>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | Place an order |
| `GET` | `/api/v1/orders` | User's order history |
| `GET` | `/api/v1/orders/{id}` | Order details |
| `POST` | `/api/v1/orders/{id}/cancel` | Cancel an order |
| `POST` | `/api/v1/payment/create-intent` | Create Stripe payment intent |

</details>

<details>
<summary><b>Admin</b></summary>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Dashboard analytics |
| `GET` | `/api/v1/admin/products` | List all products (admin) |
| `POST` | `/api/v1/admin/products` | Create product |
| `PUT` | `/api/v1/admin/products/{id}` | Update product |
| `PUT` | `/api/v1/admin/orders/{id}/status` | Update order status |
| `GET` | `/api/v1/admin/users` | List all users |

</details>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check |

<br />

## 🧪 Testing

### Backend

```bash
# All tests
dotnet test Ecommerce.sln

# Unit tests only
dotnet test tests/Ecommerce.UnitTests

# Integration tests only
dotnet test tests/Ecommerce.IntegrationTests
```

### Frontend

```bash
cd Frontend

npm test            # Run all tests
npm run test:watch  # Watch mode
```

<br />

## 🔑 Environment Variables

<details>
<summary><b>Production environment variables</b></summary>
<br />

| Variable | Description | Required |
| :--- | :--- | :---: |
| `PROD_DB_CONNECTION` | SQL Server connection string | ✅ |
| `JWT_SECRET_KEY` | JWT signing key (min 32 bytes) | ✅ |
| `REDIS_CONNECTION_STRING` | Redis connection string | ❌ |
| `STRIPE_SECRET_KEY` | Stripe secret API key | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ❌ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ❌ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ❌ |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | ❌ |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ❌ |
| `TWILIO_FROM_NUMBER` | Twilio sender phone number | ❌ |
| `SMTP_HOST` | SMTP server host | ❌ |
| `SMTP_PORT` | SMTP server port | ❌ |
| `SMTP_USERNAME` | SMTP username | ❌ |
| `SMTP_PASSWORD` | SMTP password | ❌ |
| `SMTP_FROM_ADDRESS` | Sender email address | ❌ |
| `ADMIN_EMAIL` | Default admin email | ✅ |
| `ADMIN_PASSWORD` | Default admin password | ✅ |
| `FRONTEND_URL` | Frontend URL for email links | ✅ |

> ❌ = Optional — the system gracefully falls back to local implementations

</details>

<br />

## 📊 Order Lifecycle

```
 Pending ──► Processing ──► Shipped ──► Delivered
    │                                       │
    │                                       ├──► Return Requested ──► Returned ──► Refund Initiated ──► Refunded
    │                                       │
    └──► Cancelled                          └──► Replacement Requested
        (stock auto-restored)
```

<br />

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch — `git checkout -b feature/amazing-feature`
3. **Commit** your changes — `git commit -m 'Add amazing feature'`
4. **Push** to the branch — `git push origin feature/amazing-feature`
5. **Open** a Pull Request

<br />

---

<div align="center">

**Built with ❤️ by [Muhammed Riyas B](https://github.com/MuhammedRiyasB)**

</div>
