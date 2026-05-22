import { apiSlice } from '@/app/apiSlice';

// === Order DTOs ===

export interface OrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  totalAmount: number;
}

export interface Order {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  totalPrice: number;
  transactionId: string;
  paymentMethod: string;
  cancellationReason?: string;
  returnReason?: string;
  replacementReason?: string;
  cancelledAtUtc?: string;
  returnRequestedAtUtc?: string;
  replacementRequestedAtUtc?: string;
  refundedAtUtc?: string;
  address: {
    addressId: string;
    fullName: string;
    phoneNumber: string;
    pincode: string;
    houseName: string;
    place: string;
    postOffice: string;
    landMark: string;
  };
  orderItems: OrderItem[];
}

export interface CreateOrderRequest {
  addressId: string;
  transactionId: string;
  paymentMethod: 'card' | 'cod';
}

export interface PaginatedOrders {
  items: Order[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

// === Order API ===

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Places a new order after payment is confirmed */
    placeOrder: builder.mutation<{ message: string }, CreateOrderRequest>({
      query: (body) => ({
        url: '/Order/place-order',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),

    validateDelivery: builder.query<{ canDeliver: boolean }, string>({
      query: (addressId) => `/Order/validate-delivery/${addressId}`,
    }),

    /** Fetches the authenticated user's order history */
    getUserOrders: builder.query<PaginatedOrders, { pageNumber?: number; pageSize?: number }>({
      query: (params) => ({
        url: '/Order/user-orders',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Order' as const, id: 'LIST' },
              ...result.items.map((order) => ({ type: 'Order' as const, id: order.orderId })),
            ]
          : [{ type: 'Order' as const, id: 'LIST' }],
    }),

    /** Fetches a single order by its ID */
    getOrderById: builder.query<Order, string>({
      query: (orderId) => `/Order/${orderId}`,
      providesTags: (_result, _error, orderId) => [{ type: 'Order' as const, id: orderId }],
    }),

    cancelOrder: builder.mutation<{ orderStatus: string; message: string }, { orderId: string; reason: string }>({
      query: ({ orderId, reason }) => ({
        url: `/Order/${orderId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    requestReturn: builder.mutation<{ orderStatus: string; message: string }, { orderId: string; reason: string }>({
      query: ({ orderId, reason }) => ({
        url: `/Order/${orderId}/return`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    requestReplacement: builder.mutation<{ orderStatus: string; message: string }, { orderId: string; reason: string }>({
      query: ({ orderId, reason }) => ({
        url: `/Order/${orderId}/replacement`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useValidateDeliveryQuery,
  useLazyValidateDeliveryQuery,
  useGetUserOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useRequestReturnMutation,
  useRequestReplacementMutation,
} = orderApiSlice;
