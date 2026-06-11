using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Ecommerce.IntegrationTests.Fixtures;
using FluentAssertions;

namespace Ecommerce.IntegrationTests.Controllers;

/// <summary>
/// Integration tests for CartController — tests authenticated cart operations
/// and authorization enforcement through the full HTTP pipeline.
/// </summary>
public class CartControllerTests : IClassFixture<CustomWebAppFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public CartControllerTests(CustomWebAppFactory factory)
    {
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Helper: Registers a user, logs in, and returns their JWT access token.
    /// </summary>
    private async Task<string> GetAuthTokenAsync()
    {
        var email = $"cart_test_{Guid.NewGuid():N}@gmail.com";

        await _client.PostAsJsonAsync("/api/v1/Auth/register", new
        {
            name = "Cart Tester", email, password = "Password123!"
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/Auth/login", new
        {
            email, password = "Password123!"
        });

        var content = await loginResponse.Content.ReadAsStringAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(content, _jsonOptions);
        return json.GetProperty("accessToken").GetString()!;
    }

    // ==================== Cart Tests ====================

    [Fact]
    public async Task GetCart_AuthenticatedUser_Returns200()
    {
        // Arrange — get a valid token
        var token = await GetAuthTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/Cart");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert — empty cart should still return 200
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCart_NoAuth_Returns401()
    {
        // Act — no token
        var response = await _client.GetAsync("/api/v1/Cart");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AddToCart_InvalidProduct_Returns400()
    {
        // Arrange — get a valid token
        var token = await GetAuthTokenAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/Cart/Add")
        {
            Content = JsonContent.Create(new
            {
                productId = Guid.NewGuid(), // Non-existent product
                quantity = 1
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert — should fail because product doesn't exist
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
