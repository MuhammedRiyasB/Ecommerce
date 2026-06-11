using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Application.DTOs.Identity
{
    public class UpdateProfileRequestDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = null!;

        [Range(1, 150)]
        public int? Age { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;
    }
}
