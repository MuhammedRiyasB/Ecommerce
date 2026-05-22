import { apiSlice } from '@/app/apiSlice';

// === Address DTOs ===

export interface Address {
  addressId: string;
  fullName: string;
  phoneNumber: string;
  pincode: string;
  houseName: string;
  place: string;
  postOffice: string;
  landMark: string;
}

export interface CreateAddressRequest {
  fullName: string;
  phoneNumber: string;
  pincode: string;
  houseName: string;
  place: string;
  postOffice: string;
  landMark: string;
}

interface PaginatedAddressResponse {
  items: Address[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface CreateAddressResponse {
  message: string;
  data: Address;
}

// === Address API ===

export const addressApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** Fetches all saved addresses for the authenticated user */
    getAddresses: builder.query<Address[], void>({
      query: () => '/Address',
      transformResponse: (response: PaginatedAddressResponse) => response.items ?? [],
      providesTags: ['Address'],
    }),

    /** Saves a new delivery address */
    addAddress: builder.mutation<CreateAddressResponse, CreateAddressRequest>({
      query: (body) => ({
        url: '/Address/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Address'],
    }),

    /** Updates a saved address */
    updateAddress: builder.mutation<CreateAddressResponse, { addressId: string; body: CreateAddressRequest }>({
      query: ({ addressId, body }) => ({
        url: `/Address/${addressId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Address'],
    }),

    /** Deletes a saved address */
    deleteAddress: builder.mutation<{ message: string }, string>({
      query: (addressId) => ({
        url: `/Address/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressApiSlice;
