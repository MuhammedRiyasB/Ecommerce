import { apiSlice } from '@/app/apiSlice';

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
}

export interface ProductImageEntry {
  imageUrl: string;
  color?: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  productName: string;
  sku: string;
  slug: string;
  quantity: number;
  price: number;
  discount: number;
  description: string;
  image: string;
  images: string[];
  imagesByColor: Record<string, string[]>;
  imageEntries: ProductImageEntry[];
  size: string;
  color: string;
  availableSizes: string[];
  availableColors: string[];
  deliverablePincodes: string[];
  variants: ProductVariant[];
  material?: string;
  categoryId: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  parentCategoryId?: number;
  subCategories: Category[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export interface ProductParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  size?: string;
  categorySlug?: string;
  isSale?: boolean;
}

export const catalogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductParams>({
      query: (params) => ({
        url: '/Product/All',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProductBySlug: builder.query<Product, string>({
      query: (slug) => `/Product/slug/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: 'Product', id: slug }],
    }),

    getProductById: builder.query<Product, string>({
      query: (id) => `/Product/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    getProductsByCategory: builder.query<PaginatedResponse<Product>, { categoryId: number; pageNumber?: number; pageSize?: number }>({
      query: ({ categoryId, ...params }) => ({
        url: `/Product/category/${categoryId}`,
        params,
      }),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    getCategories: builder.query<Category[], void>({
      query: () => '/Admin/categories/tree',
      providesTags: ['Category'],
    }),

    addProduct: builder.mutation<{ message: string }, FormData>({
      query: (formData) => ({
        url: '/Product/Add',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<{ message: string }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/Product/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),

    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/Product/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    getRecentProducts: builder.query<PaginatedResponse<Product>, { pageNumber?: number; pageSize?: number; minPrice?: number; maxPrice?: number }>({
      query: (params) => ({
        url: '/Product/Recent',
        params,
      }),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    getTopSellingProducts: builder.query<Product[], number | void>({
      query: (count = 10) => ({
        url: '/Product/TopSelling',
        params: { count },
      }),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    getProductsBySubCategory: builder.query<PaginatedResponse<Product>, { subCategoryId: number; pageNumber?: number; pageSize?: number }>({
      query: ({ subCategoryId, ...params }) => ({
        url: `/Product/subcategory/${subCategoryId}`,
        params,
      }),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useGetProductByIdQuery,
  useGetProductsByCategoryQuery,
  useGetCategoriesQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetRecentProductsQuery,
  useGetTopSellingProductsQuery,
  useGetProductsBySubCategoryQuery,
} = catalogApiSlice;
