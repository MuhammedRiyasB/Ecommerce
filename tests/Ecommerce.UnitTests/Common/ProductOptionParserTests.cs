using Ecommerce.Application.Common.ProductOptions;
using FluentAssertions;

namespace Ecommerce.UnitTests.Common;

public class ProductOptionParserTests
{
    [Fact]
    public void ParsePincodeList_NormalizesDigitsAndRemovesDuplicates()
    {
        var result = ProductOptionParser.ParsePincodeList("673001, 673 002, 673001, invalid, 12");

        result.Should().Equal("673001", "673002");
    }

    [Fact]
    public void ParsePincodeList_EmptyOrNull_ReturnsEmpty()
    {
        ProductOptionParser.ParsePincodeList(null).Should().BeEmpty();
        ProductOptionParser.ParsePincodeList("   ").Should().BeEmpty();
    }

    [Fact]
    public void NormalizePincodeCsv_FormatsUniqueSixDigitCodes()
    {
        var normalized = ProductOptionParser.NormalizePincodeCsv("673001,673001, 560001");

        normalized.Should().Be("673001, 560001");
    }

    [Fact]
    public void ParseOptionList_IsCaseInsensitiveForDuplicates()
    {
        var result = ProductOptionParser.ParseOptionList("Red, red, Blue");

        result.Should().Equal("Red", "Blue");
    }

    [Fact]
    public void NormalizeOptionCsv_JoinsDistinctOptions()
    {
        var normalized = ProductOptionParser.NormalizeOptionCsv("S, M, S");

        normalized.Should().Be("S, M");
    }
}
