using Asp.Versioning;
using Ecommerce.Api.Mapping;
using Ecommerce.Api.Middleware;
using Ecommerce.Application;
using Ecommerce.Application.Common.Settings;
using Ecommerce.Infrastructure;
using Ecommerce.Infrastructure.Data;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Microsoft.AspNetCore.RateLimiting;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ===================== Logging =====================
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

// ===================== Settings =====================
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.Configure<RazorPaySettings>(builder.Configuration.GetSection("RazorPaySettings"));
builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("StripeSettings"));

// ===================== Clean Architecture Layer Registrations =====================
builder.Services.AddApplication();                              // Application layer — services, validators
builder.Services.AddInfrastructure(builder.Configuration);      // Infrastructure — DbContext, repos, UoW, external services

// ===================== AutoMapper =====================
builder.Services.AddAutoMapper(cfg => cfg.AddMaps(typeof(MappingProfile).Assembly));

// ===================== FluentValidation =====================
builder.Services.AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters();

// ===================== Memory Cache =====================
builder.Services.AddMemoryCache();

// ===================== Authentication =====================
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
var hasValidJwtKey = jwtSettings != null &&
    !string.IsNullOrWhiteSpace(jwtSettings.Key) &&
    System.Text.Encoding.UTF8.GetByteCount(jwtSettings.Key) >= 32;

if (!hasValidJwtKey && builder.Environment.IsEnvironment("Testing"))
{
    builder.Configuration["Jwt:Key"] = "IntegrationTestsJwtSigningKey_32BytesMin_2026";
    builder.Configuration["Jwt:Issuer"] ??= "https://localhost:5000";
    builder.Configuration["Jwt:Audience"] ??= "https://localhost:5000";
    jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
    hasValidJwtKey = jwtSettings != null &&
        !string.IsNullOrWhiteSpace(jwtSettings.Key) &&
        System.Text.Encoding.UTF8.GetByteCount(jwtSettings.Key) >= 32;
}

// Now register the fully resolved settings into DI so AuthService gets the right key!
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

if (!hasValidJwtKey)
{
    throw new Exception("JWT Settings are missing or invalid in configuration.");
}
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings!.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
    };
});

// ===================== Authorization =====================
builder.Services.AddAuthorization();

// ===================== CORS =====================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ===================== Rate Limiting =====================
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ===================== API Versioning =====================
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// ===================== Response Compression =====================
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

// ===================== Health Checks =====================
var healthChecks = builder.Services.AddHealthChecks();

if (!builder.Environment.IsEnvironment("Testing"))
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        healthChecks.AddSqlServer(connectionString);
    }
}

// ===================== Controllers & Swagger =====================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Ecommerce API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ===================== Forwarded Headers =====================
builder.Services.Configure<Microsoft.AspNetCore.Builder.ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | 
                               Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
    // Clear the restricted proxy list so it trusts the Docker Compose Nginx container's IP
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// ===================== Middleware Pipeline =====================
app.UseForwardedHeaders();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionHandlerMiddleware>();

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseResponseCompression();
app.UseStaticFiles();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// ===================== Serve Frontend SPA =====================
if (app.Environment.IsDevelopment())
{
    // Proxy non-API, non-Swagger, non-health requests to Vite dev server in development
    app.MapWhen(context => 
        !context.Request.Path.StartsWithSegments("/api") && 
        !context.Request.Path.StartsWithSegments("/swagger") && 
        !context.Request.Path.StartsWithSegments("/health"), 
        spaApp =>
        {
            spaApp.Run(async context =>
            {
                var viteServer = "http://localhost:5173";
                var targetUri = new Uri($"{viteServer}{context.Request.Path}{context.Request.QueryString}");
                
                using var client = new HttpClient();
                using var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUri);
                
                foreach (var header in context.Request.Headers)
                {
                    if (header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase)) continue;
                    request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                }
                
                if (context.Request.ContentLength > 0 || context.Request.Headers.ContainsKey("Transfer-Encoding"))
                {
                    request.Content = new StreamContent(context.Request.Body);
                }
                
                try
                {
                    using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                    context.Response.StatusCode = (int)response.StatusCode;
                    
                    foreach (var header in response.Headers)
                    {
                        context.Response.Headers[header.Key] = header.Value.ToArray();
                    }
                    foreach (var header in response.Content.Headers)
                    {
                        context.Response.Headers[header.Key] = header.Value.ToArray();
                    }
                    
                    context.Response.Headers.Remove("transfer-encoding");
                    await response.Content.CopyToAsync(context.Response.Body);
                }
                catch (HttpRequestException)
                {
                    context.Response.StatusCode = StatusCodes.Status502BadGateway;
                    context.Response.ContentType = "text/html";
                    await context.Response.WriteAsync("<html><body><h3>Vite development server is not running on port 5173.</h3><p>Please run <code>npm run dev</code> in the <b>Frontend</b> folder.</p></body></html>");
                }
            });
        });
}
else
{
    var frontendDistPath = Path.Combine(app.Environment.ContentRootPath, "..", "Frontend", "dist");
    var hasFrontendDist = Directory.Exists(frontendDistPath);

    if (hasFrontendDist)
    {
        app.UseDefaultFiles(new DefaultFilesOptions
        {
            FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendDistPath)
        });
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendDistPath)
        });
    }
    else
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();
    }

    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = hasFrontendDist 
            ? new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendDistPath)
            : null
    });
}

// ===================== Database Seeding =====================
await DbSeeder.SeedAdminAsync(app.Services);
await DbSeeder.SeedCategoriesAsync(app.Services);

app.Run();

public partial class Program { }
