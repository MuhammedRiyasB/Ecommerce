namespace Ecommerce.Application.DTOs.Address
{
    public class CreateAddressRequestDto
    {
        public string FullName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string Pincode { get; set; } = null!;
        public string HouseName { get; set; } = null!;
        public string Place { get; set; } = null!;
        public string PostOffice { get; set; } = null!;
        public string LandMark { get; set; } = null!;
    }
}
