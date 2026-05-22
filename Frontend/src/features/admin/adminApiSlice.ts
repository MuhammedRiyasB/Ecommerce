import { apiSlice } from '@/app/apiSlice';
import type { User } from '@/features/auth/authSlice';

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface AdminUser extends User {
  isBlocked: boolean;
}

interface OrderDetails {
  orderId: string;
  orderDate: string;
  totalPrice: number;
  orderStatus: string;
  transactionId: string;
  address: any; // Simplified for now
  orderItems: any[]; // Simplified for now
}

interface RevenueResponse {
  totalRevenue: number;
  totalItemsSold: number;
}

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // User Management
    getAllUsers: builder.query<PaginatedResponse<AdminUser>, { pageNumber: number; pageSize: number }>({
      query: (params) => ({
        url: '/Admin/users',
        params,
      }),
      providesTags: ['User'],
    }),
    toggleUserBlockStatus: builder.mutation<{ message: string }, string>({
      query: (userId) => ({
        url: `/Admin/users/block-unblock/${userId}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['User'],
    }),

    // Category Management
    createCategory: builder.mutation<{ message: string }, { categoryName: string; description: string; parentCategoryId?: number | null }>({
      query: (body) => ({
        url: '/Admin/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),

    // Orders Management
    getAllOrders: builder.query<PaginatedResponse<OrderDetails>, { pageNumber: number; pageSize: number }>({
      query: (params) => ({
        url: '/Order/all-orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    changeOrderStatus: builder.mutation<{ message: string; orderStatus: string }, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/Order/change-status/${orderId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Order'],
    }),

    // Dashboard Statistics
    getRevenue: builder.query<RevenueResponse, void>({
      query: () => '/Order/revenue',
      providesTags: ['Order'],
    }),

    // Toggle Category Status
    toggleCategoryStatus: builder.mutation<{ message: string; isActive: boolean }, number>({
      query: (categoryId) => ({
        url: `/Admin/categories/${categoryId}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Category'],
    }),
    // Delete Category
    deleteCategory: builder.mutation<{ message: string }, number>({
      query: (categoryId) => ({
        url: `/Admin/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useToggleUserBlockStatusMutation,
  useCreateCategoryMutation,
  useGetAllOrdersQuery,
  useChangeOrderStatusMutation,
  useGetRevenueQuery,
  useToggleCategoryStatusMutation,
  useDeleteCategoryMutation,
} = adminApiSlice;
