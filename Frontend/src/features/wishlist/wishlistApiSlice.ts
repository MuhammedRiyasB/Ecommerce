import { apiSlice } from '@/app/apiSlice';

export interface WishlistItem {
  wishListId: string;
  productId: string;
  productName: string;
  slug: string;
  price: number;
  image: string;
}

interface WishlistResponse {
  items: WishlistItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const wishlistApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query<WishlistResponse, { pageNumber?: number; pageSize?: number } | void>({
      query: (params) => ({
        url: '/Wishlist',
        params: params ?? { pageNumber: 1, pageSize: 10 },
      }),
      providesTags: ['Wishlist'],
    }),
    addToWishlist: builder.mutation<void, string>({
      query: (productId) => ({
        url: `/Wishlist/add?productId=${productId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeWishlistItem: builder.mutation<void, string>({
      query: (wishlistId) => ({
        url: `/Wishlist/remove/${wishlistId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
});

export const { useGetWishlistQuery, useAddToWishlistMutation, useRemoveWishlistItemMutation } = wishlistApiSlice;
