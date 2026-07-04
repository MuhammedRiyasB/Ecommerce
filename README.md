<p align="center">
  <img src="Frontend/public/logo.jpeg" alt="UrbanIQ Logo" width="120" />
</p>
<h1 align="center">UrbanIQ</h1>
<p align="center">
  <strong>A production-grade, full-stack e-commerce platform built with Clean Architecture</strong>
</p>
<p align="center">
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-documentation">API Docs</a> •
  <a href="#-testing">Testing</a>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white" alt=".NET 8" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/SQL_Server-CC2927?logo=microsoftsqlserver&logoColor=white" alt="SQL Server" />
  <img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?logo=amazonec2&logoColor=white" alt="AWS EC2" />
</p>
---
## 📌 Overview
**UrbanIQ** is an enterprise-grade e-commerce platform designed for scalability, maintainability, and real-world production use. It goes beyond typical CRUD applications by implementing Clean Architecture, automated CI/CD pipelines, secure payment processing, and cloud-native deployment — the way production systems should be built.
> **Live Demo**
> - 🌐 Frontend: [urbaniq.ddnsking.com](https://urbaniq.ddnsking.com)
> - 🔗 API: [urbaniq.ddns.net](https://urbaniq.ddns.net)
> - 📄 Swagger: [urbaniq.ddns.net/swagger](https://urbaniq.ddns.net/swagger)
---
## ✨ Features
### 🛒 Customer Experience
- **Product Catalog** — Browse products with categories, variants (size/color), image galleries, slugs, and advanced filtering
- **Shopping Cart** — Add, update, and remove items with real-time stock validation
- **Wishlist** — Save favourite products for later
- **Multi-Address Checkout** — Manage multiple delivery addresses with pincode-based delivery validation
- **Stripe Payments** — Secure online card payments via Stripe Elements, plus Cash on Delivery (COD) support
- **Order Tracking** — Full order lifecycle with status tracking (Pending → Processing → Shipped → Delivered)
- **Order Cancellation** — Cancel pending/processing orders with automatic stock restoration
- **Returns & Replacements** — Request returns or replacements with reason tracking and refund lifecycle
- **Email Notifications** — Rich HTML transactional emails for order confirmation, status updates, and cancellations
- **SMS Verification** — OTP-based phone verification via Twilio
- **Responsive Design** — Fully responsive UI across mobile, tablet, and desktop
### 🛡️ Admin Dashboard
- **Revenue Analytics** — Real-time revenue, items delivered/cancelled, processing & shipped order counts
- **Product Management** — Full CRUD with multi-image upload via Cloudinary, variant management, and SKU tracking
- **Category Management** — Hierarchical category tree with image support
- **Order Management** — View, filter by status, and update order statuses through the fulfilment pipeline
- **User Management** — View and manage customer accounts
- **Low Stock Alerts** — Automatically surface products with low inventory
### 🔐 Security & Auth
- **JWT Authentication** with access & refresh token rotation
- **Role-Based Authorization** (Customer / Admin)
- **Secure Password Hashing** via ASP.NET Identity patterns
- **Rate Limiting** — Global IP-based rate limiting + dedicated login throttling
- **Security Headers** — X-Frame-Options, X-XSS-Protection, X-Content-Type-Options, Referrer-Policy
- **CORS** — Configurable allowed origins
- **Input Validation** — All requests validated with FluentValidation
- **OWASP Best Practices** — Protection against SQL Injection, XSS, CSRF, IDOR
---
## ⚙️ Tech Stack
### Backend
| Technology | Purpose |
|---|---|
| **ASP.NET Core 8** | Web API framework |
| **Entity Framework Core** | ORM with SQL Server |
| **SQL Server** | Relational database |
| **Redis** | Distributed caching (with in-memory fallback for local dev) |
| **Serilog** | Structured logging |
| **FluentValidation** | Request/model validation |
| **AutoMapper** | DTO ↔ Entity mapping |
| **Stripe.NET** | Payment gateway integration |
| **Cloudinary** | Cloud image storage & CDN (with local fallback) |
| **Twilio** | SMS/OTP notifications (with local fallback) |
| **MailKit / SMTP** | Transactional email delivery |
| **Swagger / OpenAPI** | API documentation |
| **Asp.Versioning** | API versioning (URL segment) |
### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Redux Toolkit** | Global state management |
| **RTK Query** | API communication, caching & server state |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **React Hook Form + Zod** | Form handling & validation |
| **React Router v7** | Client-side routing |
| **Stripe Elements** | Secure payment form |
| **Lucide React** | Icon system |
| **Vitest + React Testing Library** | Unit & component testing |
### DevOps & Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Multi-stage containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy, SSL termination, rate limiting |
| **Let's Encrypt / Certbot** | Auto-provisioned SSL certificates |
| **GitHub Actions** | CI/CD — build, test, deploy on push to `main` |
| **AWS EC2** | Backend hosting |
| **Vercel** | Frontend hosting |
---
## 🏗 Architecture
UrbanIQ follows **Clean Architecture** with strict separation of concerns across four layers:
```
┌──────────────────────────────────────────────────────────┐
│                    Ecommerce.Api                         │
│         Controllers · Middleware · Program.cs            │
│         Swagger · Auth · Rate Limiting · CORS            │
├──────────────────────────────────────────────────────────┤
│                Ecommerce.Application                     │
│      Services · DTOs · Interfaces · Validators           │
│      (Identity · Catalog · Cart · Orders · Wishlist      │
│       Admin Dashboard)                                   │
├──────────────────────────────────────────────────────────┤
│               Ecommerce.Infrastructure                   │
│     DbContext · Repository · UnitOfWork · Migrations     │
│     Stripe · Cloudinary · Twilio · SMTP · Redis          │
├──────────────────────────────────────────────────────────┤
│                  Ecommerce.Domain                        │
│        Entities · Enums · Interfaces · Common            │
│   (User · Product · Cart · Order · Address · Wishlist    │
│    Category · ProductVariant · ProductImage)             │
└──────────────────────────────────────────────────────────┘
```
**Key architectural patterns:**
- **Repository + Unit of Work** — Generic `IRepository<T>`, `IReadRepository<T>`, and `IUnitOfWork` with transaction support
- **Dependency Injection** — All services registered via dedicated `DependencyInjection.cs` extension methods per layer
- **Graceful Degradation** — External services (Cloudinary, Twilio, Redis) automatically fall back to local implementations when credentials aren't configured
- **Background Job Processing** — Queued email delivery via `BackgroundEmailJobQueue` + `QueuedEmailHostedService`
- **Auto-Ship Background Service** — Automated order status progression
- **Soft Delete** — `ISoftDeletable` interface with global query filters
- **Audit Fields** — `CreatedAtUtc` / `UpdatedAtUtc` patterns on entities
- **Centralized Exception Handling** — `ExceptionHandlerMiddleware` for consistent API error responses
- **Security Headers Middleware** — Applied globally via `SecurityHeadersMiddleware`
---
## 📁 Project Structure
```
UrbanIQ/
├── Backend/
│   ├── Ecommerce.Api/              # API layer — Controllers, Middleware, Program.cs
│   │   ├── Controllers/
│   │   │   ├── Admin/              # Dashboard, product/order/user management endpoints
│   │   │   ├── Cart/               # Cart CRUD endpoints
│   │   │   ├── Catalog/            # Product & category browsing endpoints
│   │   │   ├── Identity/           # Auth, registration, address management
│   │   │   ├── Orders/             # Order placement, tracking, cancellation
│   │   │   ├── Payment/            # Stripe payment intent creation
│   │   │   └── Wishlist/           # Wishlist management
│   │   ├── HostedServices/         # Background services (auto-ship)
│   │   ├── Mapping/                # AutoMapper profiles
│   │   └── Middleware/             # Exception handling, security headers
│   ├── Ecommerce.Application/      # Business logic layer
│   │   ├── DTOs/                   # Request/Response data transfer objects
│   │   ├── Interfaces/             # Service contracts
│   │   ├── Services/               # Service implementations
│   │   │   ├── Admin/              # Dashboard analytics
│   │   │   ├── Cart/               # Cart operations
│   │   │   ├── Catalog/            # Product & category logic
│   │   │   ├── Identity/           # Auth, user management, address
│   │   │   ├── Orders/             # Order lifecycle management
│   │   │   └── Wishlist/           # Wishlist logic
│   │   └── Validators/             # FluentValidation validators
│   ├── Ecommerce.Domain/           # Core domain layer
│   │   ├── Entities/               # User, Product, Order, Cart, Address, etc.
│   │   ├── Enums/                  # OrderStatus, UserRole
│   │   ├── Interfaces/             # IRepository, IUnitOfWork, ISoftDeletable
│   │   └── Common/                 # Shared domain objects (PagedResult, etc.)
│   └── Ecommerce.Infrastructure/   # Data access & external services
│       ├── Data/                   # AppDbContext, Repository, UnitOfWork, Seeder
│       ├── Configurations/         # EF Core entity configurations
│       ├── Migrations/             # Database migrations
│       └── Services/               # Stripe, Cloudinary, Twilio, SMTP, Email queue
├── Frontend/
│   └── src/
│       ├── app/                    # Redux store configuration
│       ├── features/               # Feature-based modules
│       │   ├── admin/              # Admin dashboard, product/order/user management
│       │   ├── auth/               # Login, register, auth slice
│       │   ├── cart/               # Cart page & API slice
│       │   ├── catalog/            # Product listing, detail pages
│       │   ├── checkout/           # Checkout flow, address & payment API slices
│       │   ├── orders/             # Order history & tracking
│       │   ├── account/            # User profile & address management
│       │   └── wishlist/           # Wishlist page & API slice
│       ├── hooks/                  # Custom React hooks
│       ├── layouts/                # Layout components
│       └── test/                   # Test setup & utilities
├── tests/
│   ├── Ecommerce.UnitTests/        # xUnit unit tests
│   └── Ecommerce.IntegrationTests/ # xUnit integration tests
├── nginx/                          # Nginx reverse proxy configuration
├── .github/workflows/              # GitHub Actions CI/CD pipeline
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml              # Production orchestration
└── Ecommerce.sln                   # Solution file
```
---
## 🚀 Getting Started
### Prerequisites
| Tool | Version |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0+ |
| [Node.js](https://nodejs.org/) | 20+ |
| [SQL Server](https://www.microsoft.com/sql-server) | 2019+ (or LocalDB) |
| [Redis](https://redis.io/) | Optional (falls back to in-memory cache) |
| [Docker](https://www.docker.com/) | Optional (for containerized deployment) |
### 1. Clone the Repository
```bash
git clone https://github.com/MuhammedRiyasB/Ecommerce.git
cd Ecommerce
```
### 2. Backend Setup
```bash
# Copy and configure the example settings file
cp Backend/Ecommerce.Api/appsettings.Development.example.json Backend/Ecommerce.Api/appsettings.Development.json
```
Edit `appsettings.Development.json` with your credentials:
```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=EcommerceDb;Trusted_Connection=True;TrustServerCertificate=True;",
    "Redis": "SET_VIA_USER_SECRETS_OR_ENV_VAR"  // Optional — leave as-is for in-memory fallback
  },
  "Jwt": {
    "Key": "YOUR_SECRET_KEY_MIN_32_CHARACTERS_LONG"
  },
  "StripeSettings": {
    "PublishableKey": "pk_test_...",
    "SecretKey": "sk_test_..."
  },
  "CloudinarySettings": {
    // Leave as-is to use local file storage fallback
  },
  "EmailSettings": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromAddress": "noreply@urbaniq.com",
    "FrontendUrl": "http://localhost:5173"
  }
}
```
> **💡 Tip:** Only `ConnectionStrings:DefaultConnection` and `Jwt:Key` are required. All external services (Cloudinary, Twilio, Redis) gracefully fall back to local implementations when not configured.
```bash
# Restore and run the backend
dotnet restore Ecommerce.sln
dotnet ef database update --project Backend/Ecommerce.Infrastructure --startup-project Backend/Ecommerce.Api
dotnet run --project Backend/Ecommerce.Api
```
The API will be available at `https://localhost:7078` with Swagger at `/swagger`.
### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.
### 4. Admin Access
On first launch, the database is seeded with a default admin account using the credentials from `AdminSettings` in your configuration. Navigate to `/admin-login` to access the admin dashboard.
---
## 🐳 Deployment
### Docker (Production)
The project uses a multi-stage Dockerfile and Docker Compose for production deployment:
```bash
# Build and run locally with Docker Compose
docker compose up -d
```
**docker-compose.yml** orchestrates:
- `api` — ASP.NET Core backend container
- `nginx` — Reverse proxy with SSL termination
### CI/CD Pipeline
The GitHub Actions workflow (`.github/workflows/deploy-ec2.yml`) automates the entire deployment:
```
Push to main → Build & Test → Docker Build → Push to Docker Hub → Deploy to EC2
```
**Pipeline stages:**
1. **Build & Test** — Restore, build, and run all xUnit tests
2. **Docker Build** — Multi-stage build and push to Docker Hub
3. **Deploy** — SSH into EC2, pull latest image, restart with Docker Compose
4. **SSL** — Auto-provisions Let's Encrypt certificates via Certbot on first deploy
### Infrastructure
```
                        ┌─────────────┐
                        │   Vercel    │
                        │  (Frontend) │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
  Users ──── HTTPS ────►│    Nginx    │──── Reverse Proxy ────► ASP.NET Core API
                        │   (SSL +    │                              │
                        │ Rate Limit) │                    ┌────────┼────────┐
                        └─────────────┘                    │        │        │
                                                      SQL Server  Redis  Cloudinary
```
---
## 📄 API Documentation
Interactive API documentation is available via **Swagger / OpenAPI** at `/swagger` when the app is running.
### Key API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | Login (JWT + refresh token) |
| `POST` | `/api/v1/auth/refresh-token` | Refresh access token |
| `GET` | `/api/v1/products` | Browse product catalog |
| `GET` | `/api/v1/products/{slug}` | Product detail by slug |
| `GET` | `/api/v1/categories` | List categories |
| `GET/POST/PUT/DELETE` | `/api/v1/cart` | Cart management |
| `POST` | `/api/v1/orders` | Place an order |
| `GET` | `/api/v1/orders` | User's order history |
| `POST` | `/api/v1/payment/create-intent` | Create Stripe payment intent |
| `GET/POST/PUT/DELETE` | `/api/v1/wishlist` | Wishlist management |
| `GET` | `/api/v1/admin/dashboard` | Admin dashboard stats |
| `GET` | `/api/v1/admin/products` | Admin product management |
| `PUT` | `/api/v1/admin/orders/{id}/status` | Update order status |
| `GET` | `/health` | Health check endpoint |
> All endpoints are versioned via URL segments (`/api/v1/...`) and require JWT Bearer authentication where applicable.
---
## 🧪 Testing
The project includes both backend and frontend test suites:
### Backend Tests
```bash
# Run all backend tests (unit + integration)
dotnet test Ecommerce.sln
# Run unit tests only
dotnet test tests/Ecommerce.UnitTests
# Run integration tests only
dotnet test tests/Ecommerce.IntegrationTests
```
- **Unit Tests** — Service-level tests with mocked dependencies (xUnit)
- **Integration Tests** — Controller-level tests against a real test server (xUnit + WebApplicationFactory)
### Frontend Tests
```bash
cd Frontend
# Run all tests
npm test
# Run in watch mode
npm run test:watch
```
- **Component Tests** — React Testing Library + Vitest
- **Validation Tests** — Payment card validation logic tests
---
## 🔧 Environment Variables
For production deployment, the following environment variables are required:
| Variable | Description |
|---|---|
| `PROD_DB_CONNECTION` | SQL Server connection string |
| `REDIS_CONNECTION_STRING` | Redis connection string (Upstash/ElastiCache) |
| `JWT_SECRET_KEY` | JWT signing key (min 32 bytes) |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Twilio sender phone number |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USERNAME` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM_ADDRESS` | Email sender address |
| `ADMIN_EMAIL` | Default admin account email |
| `ADMIN_PASSWORD` | Default admin account password |
| `FRONTEND_URL` | Frontend URL for email links |
---
## 📊 Order Lifecycle
UrbanIQ supports a full order lifecycle with unidirectional status flow:
```
  Pending → Processing → Shipped → Delivered
     │                                   │
     ├── Cancelled (stock restored)      ├── Return Requested → Returned → Refund Initiated → Refunded
     │                                   │
     │                                   └── Replacement Requested
     └── (COD or Card payment)
```
---
## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
---
## 📜 License
This project is open source and available under the [MIT License](LICENSE).
---
<p align="center">
  Built with ❤️ by <a href="https://github.com/MuhammedRiyasB">Muhammed Riyas B</a>
</p>
