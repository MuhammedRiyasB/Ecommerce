import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    // Break circular dependency by not importing RootState
    const state = getState() as { auth: { token: string | null } };
    const token = state.auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Product', 'Order', 'Category', 'Cart', 'User', 'Address', 'Wishlist'],
  endpoints: () => ({}),
});
