import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeleteProductMutation, useGetProductsQuery } from '../catalog/catalogApiSlice';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const ProductManagementPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data, isLoading } = useGetProductsQuery({
    pageNumber: page,
    pageSize: 10,
    search: search || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This hides the product from the storefront.`)) return;

    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9d731e]">Catalog control</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-[#111827]">Products</h2>
          <p className="mt-2 text-sm text-[#6f6659]">Manage styles, pricing, imagery, inventory, and storefront visibility.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-11 items-center justify-center gap-2 bg-[#111827] px-5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1f2740]"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      <section className="border border-[#e1d5c2] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#eee6da] bg-[#fbfaf7] p-4 md:flex-row md:items-center md:justify-between">
          <label className="relative w-full md:w-[40%]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8174]" />
            <input
              type="search"
              placeholder="Search products by name..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full border border-[#d8cdbb] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#9d731e]"
            />
          </label>
          <div className="flex w-full md:w-auto items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(event) => {
                const val = event.target.value;
                if (Number(val) < 0) return;
                setMinPrice(val);
                setPage(1);
              }}
              className="h-11 w-24 border border-[#d8cdbb] bg-white px-3 text-sm outline-none focus:border-[#9d731e]"
            />
            <span className="text-[#8a8174]">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(event) => {
                const val = event.target.value;
                if (Number(val) < 0) return;
                setMaxPrice(val);
                setPage(1);
              }}
              className="h-11 w-24 border border-[#d8cdbb] bg-white px-3 text-sm outline-none focus:border-[#9d731e]"
            />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7c7467]">
            {data?.totalCount || 0} styles
          </p>
        </div>

        {isLoading ? (
          <div className="grid place-items-center p-10">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d7b46a] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-[#eee6da] bg-[#f3ecdf] text-[11px] font-black uppercase tracking-[0.22em] text-[#514b43]">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6da]">
                {data?.items?.length ? (
                  data.items.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-[#fbfaf7]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <Link to={`/admin/products/${product.id}`}>
                            <img
                              src={product.image}
                              alt={product.productName}
                              className="h-16 w-12 object-cover bg-[#efe7da]"
                              onError={(event) => {
                                event.currentTarget.src = 'https://placehold.co/96x128?text=No+Image';
                              }}
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link to={`/admin/products/${product.id}`} className="block truncate text-sm font-bold text-[#111827] hover:text-[#9d731e] transition-colors">
                              {product.productName}
                            </Link>
                            <p className="mt-1 text-xs text-[#7c7467]">{product.categoryName || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-[#514b43]">{product.sku}</td>
                      <td className="px-5 py-4 text-sm font-black text-[#111827]">{formatCurrency(product.price - product.discount)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                          product.quantity <= 0 ? 'bg-red-50 text-red-700' :
                          product.quantity <= 10 ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {product.quantity} in stock
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.productName)}
                          disabled={isDeleting}
                          className="grid h-9 w-9 place-items-center border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#7c7467]">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#eee6da] bg-[#fbfaf7] px-5 py-4">
            <p className="text-sm text-[#6f6659]">
              Page <span className="font-bold text-[#111827]">{data.pageNumber}</span> of{' '}
              <span className="font-bold text-[#111827]">{data.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
                className="h-9 border border-[#d8cdbb] bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="h-9 border border-[#d8cdbb] bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductManagementPage;
