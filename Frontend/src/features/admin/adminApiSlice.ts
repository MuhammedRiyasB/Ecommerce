import { apiSlice } from '@/app/apiSlice';
import type { User } from '@/features/auth/authSlice';

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
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
  userEmail?: string;
  address: any; // Simplified for now
  orderItems: any[]; // Simplified for now
}

interface DashboardStats {
  totalRevenue: number;
  totalItemsDelivered: number;
  totalItemsCancelled: number;
  totalProcessingOrders: number;
  totalShippedOrders: number;
  totalCustomers: number;
  lowStockCount: number;
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
    getAllOrders: builder.query<PaginatedResponse<OrderDetails>, { pageNumber: number; pageSize: number; status?: string }>({
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
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/Admin/dashboard-stats',
      providesTags: ['Order', 'User', 'Product'],
    }),
    getLowStockProducts: builder.query<any[], void>({
      query: () => '/Admin/low-stock-products?threshold=10&limit=5',
      providesTags: ['Product'],
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
  useGetDashboardStatsQuery,
  useGetLowStockProductsQuery,
  useToggleCategoryStatusMutation,
  useDeleteCategoryMutation,
} = adminApiSlice;
