import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, CreditCard, CheckCircle, Circle, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCancelOrderMutation, useGetOrderByIdQuery, useRequestReplacementMutation, useRequestReturnMutation } from './orderApiSlice';

const trackingSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, isError } = useGetOrderByIdQuery(orderId || '');
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [requestReturn, { isLoading: isReturning }] = useRequestReturnMutation();
  const [requestReplacement, { isLoading: isReplacing }] = useRequestReplacementMutation();
  const [reason, setReason] = useState('');

  const activeStepIndex = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, trackingSteps.findIndex((step) => step.toLowerCase() === order.orderStatus.toLowerCase()));
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-2 text-xl font-black text-gray-900">Order Not Found</h2>
        <Link to="/orders" className="mt-4 text-sm font-bold text-teal-600 hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const canCancel = ['pending', 'processing'].includes(order.orderStatus.toLowerCase());
  const canReturn = order.orderStatus.toLowerCase() === 'delivered';
  const canReplace = order.orderStatus.toLowerCase() === 'delivered';

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Add a reason first');
      return;
    }
    await cancelOrder({ orderId: order.orderId, reason }).unwrap();
    toast.success('Order cancelled');
    setReason('');
  };

  const handleReturn = async () => {
    if (!reason.trim()) {
      toast.error('Add a reason first');
      return;
    }
    await requestReturn({ orderId: order.orderId, reason }).unwrap();
    toast.success('Return request submitted');
    setReason('');
  };

  const handleReplacement = async () => {
    if (!reason.trim()) {
      toast.error('Add a reason first');
      return;
    }
    await requestReplacement({ orderId: order.orderId, reason }).unwrap();
    toast.success('Replacement request submitted');
    setReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'returnrequested': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'replacementrequested': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'refunded': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link to="/orders" className="rounded-full p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-gray-900">Order Details</h1>
            <p className="mt-0.5 text-xs text-gray-400">ID: {order.orderId}</p>
          </div>
        </div>

        <div className={`mb-6 border p-4 ${getStatusColor(order.orderStatus)}`}>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            <div>
              <p className="text-sm font-black uppercase tracking-wider">{order.orderStatus}</p>
              <p className="mt-0.5 text-xs opacity-80">
                Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {(order.cancellationReason || order.returnReason || order.replacementReason || order.cancelledAtUtc || order.returnRequestedAtUtc || order.replacementRequestedAtUtc || order.refundedAtUtc) && (
          <div className="mb-4 border border-gray-100 bg-white p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-900">Service Update</h3>
            <div className="space-y-3 text-sm text-gray-700">
              {order.cancellationReason && (
                <p>
                  <span className="font-black text-gray-900">Cancellation reason:</span> {order.cancellationReason}
                </p>
              )}
              {order.returnReason && (
                <p>
                  <span className="font-black text-gray-900">Return reason:</span> {order.returnReason}
                </p>
              )}
              {order.replacementReason && (
                <p>
                  <span className="font-black text-gray-900">Replacement reason:</span> {order.replacementReason}
                </p>
              )}
              {order.cancelledAtUtc && (
                <p>
                  <span className="font-black text-gray-900">Cancelled on:</span>{' '}
                  {new Date(order.cancelledAtUtc).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {order.returnRequestedAtUtc && (
                <p>
                  <span className="font-black text-gray-900">Return requested on:</span>{' '}
                  {new Date(order.returnRequestedAtUtc).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {order.replacementRequestedAtUtc && (
                <p>
                  <span className="font-black text-gray-900">Replacement requested on:</span>{' '}
                  {new Date(order.replacementRequestedAtUtc).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {order.refundedAtUtc && (
                <p>
                  <span className="font-black text-gray-900">Refunded on:</span>{' '}
                  {new Date(order.refundedAtUtc).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}

        {!['cancelled', 'returnrequested', 'replacementrequested', 'returned', 'refunded'].includes(order.orderStatus.toLowerCase()) && (
          <div className="mb-4 border border-gray-100 bg-white p-6">
            <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-gray-900">Order Tracking</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {trackingSteps.map((step, index) => {
                const isDone = index <= activeStepIndex;
                return (
                  <div key={step} className="flex items-center gap-2">
                    {isDone ? <CheckCircle className="h-5 w-5 text-teal-600" /> : <Circle className="h-5 w-5 text-gray-300" />}
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4 border border-gray-100 bg-white p-6">
          <h3 className="mb-5 text-xs font-black uppercase tracking-widest text-gray-900">
            Items ({order.orderItems.length})
          </h3>
          <div className="divide-y divide-gray-100">
            {order.orderItems.map((item) => (
              <div key={item.orderItemId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <img
                  src={item.imageUrl || 'https://via.placeholder.com/80x100'}
                  alt={item.productName}
                  className="h-20 w-16 shrink-0 bg-gray-50 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{item.productName}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                  </p>
                  <span className="mt-1.5 block text-sm font-black">Rs. {item.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(canCancel || canReturn || canReplace) && (
          <div className="mb-4 border border-gray-100 bg-white p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-900">Order Help</h3>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="w-full resize-none border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
              placeholder={canCancel ? 'Reason for cancellation' : 'Reason for return or replacement'}
            />
            <div className="mt-3 flex gap-3">
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="inline-flex items-center gap-2 bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </button>
              )}
              {canReturn && (
                <button
                  onClick={handleReturn}
                  disabled={isReturning}
                  className="inline-flex items-center gap-2 bg-teal-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Request Return
                </button>
              )}
              {canReplace && (
                <button
                  onClick={handleReplacement}
                  disabled={isReplacing}
                  className="inline-flex items-center gap-2 bg-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Request Replacement
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Payment</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method</span>
              <span className="font-medium uppercase text-gray-900">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="text-xs font-medium text-gray-900">{order.transactionId}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-black text-gray-900">
              <span>Total Paid</span>
              <span>Rs. {order.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-100 bg-white p-6">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-900">Delivery Address</h3>
          <div className="text-sm text-gray-700">
            <p className="font-bold">{order.address.fullName}</p>
            <p>{order.address.houseName}, {order.address.place}</p>
            <p>{order.address.postOffice}, {order.address.landMark}</p>
            <p>Pincode: {order.address.pincode} | Phone: {order.address.phoneNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
