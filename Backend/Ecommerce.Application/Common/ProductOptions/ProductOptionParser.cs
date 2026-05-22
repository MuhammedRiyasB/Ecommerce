using System.Text.RegularExpressions;

namespace Ecommerce.Application.Common.ProductOptions
{
    public static class ProductOptionParser
    {
        public static IReadOnlyList<string> ParseOptionList(string? csv)
        {
            if (string.IsNullOrWhiteSpace(csv))
            {
                return Array.Empty<string>();
            }

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var values = new List<string>();

            foreach (var value in csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var trimmed = value.Trim();
                if (trimmed.Length == 0 || !seen.Add(trimmed))
                {
                    continue;
                }

                values.Add(trimmed);
            }

            return values;
        }

        public static string NormalizeOptionCsv(string? csv)
        {
            return string.Join(", ", ParseOptionList(csv));
        }

        public static IReadOnlyList<string> ParsePincodeList(string? csv)
        {
            if (string.IsNullOrWhiteSpace(csv))
            {
                return Array.Empty<string>();
            }

            var seen = new HashSet<string>(StringComparer.Ordinal);
            var pincodes = new List<string>();

            foreach (var value in csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var digitsOnly = Regex.Replace(value, @"\D", string.Empty);
                if (digitsOnly.Length != 6 || !seen.Add(digitsOnly))
                {
                    continue;
                }

                pincodes.Add(digitsOnly);
            }

            return pincodes;
        }

        public static string NormalizePincodeCsv(string? csv)
        {
            return string.Join(", ", ParsePincodeList(csv));
        }
    }
}
