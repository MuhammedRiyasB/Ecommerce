import { useGetRevenueQuery, useGetAllOrdersQuery, useGetAllUsersQuery } from './adminApiSlice';
import { Activity, ArrowUpRight, CheckCircle2, Package, ReceiptText, TrendingUp, Users } from 'lucide-react';
import { useGetProductsQuery } from '../catalog/catalogApiSlice';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const AdminDashboardPage = () => {
  const { data: revenueData, isLoading: isRevenueLoading, error } = useGetRevenueQuery();
  const { data: productsData, isLoading: isProductsLoading } = useGetProductsQuery({ pageNumber: 1, pageSize: 5 });
  const { data: ordersData, isLoading: isOrdersLoading } = useGetAllOrdersQuery({ pageNumber: 1, pageSize: 5 });
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsersQuery({ pageNumber: 1, pageSize: 5 });

  const isLoading = isRevenueLoading || isProductsLoading || isOrdersLoading || isUsersLoading;
  const lowStockCount = productsData?.items.filter((product) => product.quantity <= 10).length ?? 0;
  const pendingOrders = ordersData?.items.filter((order) => order.orderStatus.toLowerCase() === 'pending').length ?? 0;

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        Failed to load dashboard statistics.
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: revenueData ? formatCurrency(revenueData.totalRevenue) : formatCurrency(0),
      detail: 'Confirmed order item revenue',
      icon: TrendingUp,
      tone: 'gold',
    },
    {
      label: 'Items Sold',
      value: revenueData?.totalItemsSold.toLocaleString('en-IN') || '0',
      detail: 'Units moved across all orders',
      icon: Package,
      tone: 'navy',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.toString(),
      detail: 'Need fulfilment review',
      icon: ReceiptText,
      tone: 'amber',
    },
    {
      label: 'Customers',
      value: usersData?.totalCount.toLocaleString('en-IN') || '0',
      detail: 'Registered customer accounts',
      icon: Users,
      tone: 'green',
    },
  ];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden bg-[#111827] text-[#f8f5ee]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#d7b46a]">Executive overview</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl">Store command center</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d8d2c8]">
              Monitor revenue, fulfilment pressure, inventory exposure, and customer activity from one operational view.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-[#263044] bg-[#172033] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d7b46a]">System health</p>
              <div className="mt-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span className="text-2xl font-black uppercase">Online</span>
              </div>
            </div>
            <div className="border border-[#263044] bg-[#172033] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d7b46a]">Low stock styles</p>
              <div className="mt-4 flex items-center gap-3">
                <Activity className="h-6 w-6 text-amber-300" />
                <span className="text-2xl font-black">{lowStockCount}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="border border-[#e1d5c2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8a8174]">{item.label}</p>
                <p className="mt-3 text-3xl font-black text-[#111827]">{isLoading ? '...' : item.value}</p>
              </div>
              <div className={`grid h-11 w-11 place-items-center ${
                item.tone === 'gold' ? 'bg-[#f3ecdf] text-[#9d731e]' :
                item.tone === 'green' ? 'bg-emerald-50 text-emerald-700' :
                item.tone === 'amber' ? 'bg-amber-50 text-amber-700' :
                'bg-[#111827] text-[#d7b46a]'
              }`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm text-[#6f6659]">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-[#e1d5c2] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee6da] px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9d731e]">Fulfilment</p>
              <h3 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#111827]">Recent Orders</h3>
            </div>
            <ArrowUpRight className="h-5 w-5 text-[#9d731e]" />
          </div>
          <div className="divide-y divide-[#eee6da]">
            {ordersData?.items.length ? (
              ordersData.items.map((order) => (
                <div key={order.orderId} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#111827]">{order.transactionId || order.orderId.slice(0, 8)}</p>
                    <p className="mt-1 text-xs text-[#7c7467]">{new Date(order.orderDate).toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-black text-[#111827]">{formatCurrency(order.totalPrice)}</span>
                  <span className="w-fit bg-[#f3ecdf] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#9d731e]">
                    {order.orderStatus}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-[#7c7467]">No orders yet.</div>
            )}
          </div>
        </div>

        <div className="border border-[#e1d5c2] bg-white">
          <div className="border-b border-[#eee6da] px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9d731e]">Inventory</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#111827]">Stock Watchlist</h3>
          </div>
          <div className="divide-y divide-[#eee6da]">
            {productsData?.items.length ? (
              productsData.items.map((product) => (
                <div key={product.id} className="flex items-center gap-4 px-5 py-4">
                  <img src={product.image} alt="" className="h-14 w-12 object-cover bg-[#efe7da]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#111827]">{product.productName}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#7c7467]">{product.sku}</p>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                    product.quantity <= 5 ? 'bg-red-50 text-red-700' : product.quantity <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {product.quantity} left
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-sm text-[#7c7467]">No products found.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
