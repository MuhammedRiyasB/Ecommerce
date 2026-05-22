namespace Ecommerce.Domain.Enums
{
    public enum OrderStatus
    {
        Pending,
        Processing,
        Shipped,
        Delivered,
        Cancelled,
        ReturnRequested,
        ReplacementRequested,
        Returned,
        RefundInitiated,
        Refunded
    }
}
