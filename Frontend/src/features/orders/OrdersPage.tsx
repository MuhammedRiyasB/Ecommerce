import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, MapPin, CreditCard, Banknote } from 'lucide-react';
import { useGetUserOrdersQuery } from './orderApiSlice';
import type { Order, OrderItem } from './orderApiSlice';

type OrderFilter = 'all' | 'active' | 'cancelled';

const formatOrderId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

const formatPaymentLabel = (method: string) => {
  const normalized = method?.toLowerCase();
  if (normalized === 'cod') return 'Cash on Delivery';
  if (normalized === 'card') return 'Card Payment';
  return method;
};

const formatStatusLabel = (status: string) => {
  const normalized = status?.toLowerCase();
  const labels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refundinitiated: 'Refund Initiated',
    refunded: 'Refunded',
  };
  return labels[normalized] || status;
};

const isCancelledOrder = (order: Order) => order.orderStatus?.toLowerCase() === 'cancelled';

const formatItemVariant = (item: OrderItem) =>
  `Size ${item.size} · ${item.color} · Qty ${item.quantity}`;

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return 'text-green-600 bg-green-50';
    case 'cancelled':
      return 'text-red-600 bg-red-50';
    case 'shipped':
      return 'text-blue-600 bg-blue-50';
    case 'processing':
      return 'text-orange-600 bg-orange-50';
    case 'pending':
      return 'text-amber-600 bg-amber-50';
    case 'refunded':
    case 'refundinitiated':
      return 'text-green-700 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const OrdersPage: React.FC = () => {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const { data: ordersData, isLoading, isError } = useGetUserOrdersQuery({ pageNumber: 1, pageSize: 50 });

  const { activeOrders, cancelledOrders } = useMemo(() => {
    const all = ordersData?.items || [];
    return {
      activeOrders: all.filter((order) => !isCancelledOrder(order)),
      cancelledOrders: all.filter((order) => isCancelledOrder(order)),
    };
  }, [ordersData?.items]);

  const visibleOrders = useMemo(() => {
    if (filter === 'active') return activeOrders;
    if (filter === 'cancelled') return cancelledOrders;
    return ordersData?.items || [];
  }, [filter, activeOrders, cancelledOrders, ordersData?.items]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-2 text-xl font-black text-gray-900">Failed to Load Orders</h2>
        <p className="mb-6 text-sm text-gray-500">Please try again later.</p>
        <button onClick={() => window.location.reload()} className="bg-teal-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white">
          Retry
        </button>
      </div>
    );
  }

  const totalOrders = ordersData?.items?.length || 0;

  if (totalOrders === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Package className="mb-6 h-20 w-20 text-gray-200" />
        <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-gray-900">No Orders Yet</h2>
        <p className="mb-8 max-w-sm text-sm text-gray-500">
          You have not placed any orders. Start shopping to see your orders here.
        </p>
        <Link to="/catalog" className="bg-teal-600 px-10 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-teal-700">
          Start Shopping
        </Link>
      </div>
    );
  }

  const filterOptions: { key: OrderFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All orders', count: totalOrders },
    { key: 'active', label: 'Placed orders', count: activeOrders.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelledOrders.length },
  ];

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-gray-900">My Orders</h1>
        <p className="mb-6 text-sm text-gray-500">
          {activeOrders.length} placed · {cancelledOrders.length} cancelled
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === option.key
                  ? 'bg-teal-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-teal-300'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        {visibleOrders.length === 0 ? (
          <div className="border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">
              {filter === 'cancelled' ? 'No cancelled orders.' : 'No active orders right now.'}
            </p>
          </div>
        ) : filter === 'all' ? (
          <div className="space-y-8">
            {activeOrders.length > 0 && (
              <OrderSection title="Placed orders" orders={activeOrders} />
            )}
            {cancelledOrders.length > 0 && (
              <OrderSection title="Cancelled orders" orders={cancelledOrders} muted />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface OrderSectionProps {
  title: string;
  orders: Order[];
  muted?: boolean;
}

const OrderSection: React.FC<OrderSectionProps> = ({ title, orders, muted }) => (
  <section>
    <h2 className={`mb-4 text-xs font-black uppercase tracking-widest ${muted ? 'text-red-600' : 'text-gray-900'}`}>
      {title} ({orders.length})
    </h2>
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.orderId} order={order} />
      ))}
    </div>
  </section>
);

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const firstItem = order.orderItems[0];
  const extraCount = order.orderItems.length - 1;
  const isCod = order.paymentMethod?.toLowerCase() === 'cod';
  const isCancelled = isCancelledOrder(order);

  return (
    <Link
      to={`/orders/${order.orderId}`}
      className={`group block border bg-white p-5 transition-colors hover:border-gray-200 ${
        isCancelled ? 'border-red-100' : 'border-gray-100'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.orderStatus)}`}>
              {formatStatusLabel(order.orderStatus)}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(order.orderDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Order #{formatOrderId(order.orderId)}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>

      {firstItem && (
        <div className="flex gap-4 border-t border-gray-50 pt-4">
          <img
            src={firstItem.imageUrl || 'https://via.placeholder.com/80x100'}
            alt={firstItem.productName}
            className="h-20 w-16 shrink-0 bg-gray-50 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-bold text-gray-900">{firstItem.productName}</p>
            <p className="mt-1 text-xs text-gray-500">{formatItemVariant(firstItem)}</p>
            {extraCount > 0 && (
              <p className="mt-2 text-xs font-semibold text-teal-700">
                + {extraCount} more {extraCount === 1 ? 'item' : 'items'}
                {order.orderItems.slice(1, 3).map((item) => (
                  <span key={item.orderItemId} className="mt-1 block font-normal text-gray-500">
                    {item.productName}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2 border-t border-gray-50 pt-4 text-xs text-gray-600 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          {isCod ? <Banknote className="h-3.5 w-3.5 shrink-0 text-gray-400" /> : <CreditCard className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
          <span>
            <span className="font-bold text-gray-700">Payment:</span> {formatPaymentLabel(order.paymentMethod)}
          </span>
        </div>
        {order.address && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>
              <span className="font-bold text-gray-700">Deliver to:</span>{' '}
              {order.address.fullName}, {order.address.place} — {order.address.pincode}
            </span>
          </div>
        )}
      </div>

      {isCancelled && order.cancellationReason && (
        <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-bold">Cancelled because:</span> {order.cancellationReason}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
        <span className="text-sm font-black text-gray-900">Rs. {order.totalPrice.toLocaleString()}</span>
        <span className="text-xs text-gray-400">
          {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'} · View details
        </span>
      </div>
    </Link>
  );
};

export default OrdersPage;
