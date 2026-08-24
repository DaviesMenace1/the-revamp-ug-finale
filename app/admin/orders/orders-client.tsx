'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Search,
  Eye,
  Trash2,
  X,
  Package,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react'
import { updateOrderStatus, deleteOrder } from '@/lib/actions/orders'
import { formatMoney } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
}

export default function OrdersClient({ initialOrders = [] }: { initialOrders: any[] }) {
  const [ordersList, setOrdersList] = useState(initialOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isPending, startTransition] = useTransition()

  type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus)
      if (res.success) {
        setOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
        }
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order record?')) return

    startTransition(async () => {
      const res = await deleteOrder(id)
      if (res.success) {
        setOrdersList((prev) => prev.filter((o) => o.id !== id))
        if (selectedOrder?.id === id) setSelectedOrder(null)
      }
    })
  }

  const filteredOrders = ordersList.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerFirstName || ''} ${order.customerLastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryAddress?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen space-y-8 bg-muted/30 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Revamp operations · 03</p>
          <h1 className="mt-3 font-serif text-5xl font-normal leading-none text-foreground">Orders & Fulfillment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer checkout transactions, payment statuses, and shipping fulfillment
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order #, email, or customer name..."
            className="pl-9 rounded-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs capitalize px-3 py-1.5 border transition-colors shrink-0 ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-border/70 bg-background shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border/30">
            <tr>
              <th className="py-3 px-4">Order Ref</th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground font-light">
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const address = order.deliveryAddress || {}
                const itemsCount = order.items?.length || 0

                return (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                    {/* Order Reference */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-foreground">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Package className="w-3 h-3" /> {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{[order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') || address.name || order.customerEmail || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {order.customerEmail || order.userId}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 font-mono text-sm font-medium">
                      {formatMoney(order.total, order.currency || 'UGX')}
                    </td>

                    {/* Status Select Badge */}
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={isPending}
                        className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-1 border rounded-none cursor-pointer focus:outline-none ${
                          STATUS_COLORS[order.status] || STATUS_COLORS.pending
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed / Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(order.id)}
                          className="h-8 px-2 text-destructive hover:bg-destructive/10"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <Card className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-border bg-background p-6 shadow-lift">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-3 top-3 flex size-11 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-4 mb-6">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl font-light text-foreground">Order Details</h2>
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 border ${
                    STATUS_COLORS[selectedOrder.status]
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                TxRef: {selectedOrder.orderNumber}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6 text-sm">
              {/* Shipping Address */}
              <div className="space-y-2 border p-4 bg-muted/10">
                <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Shipping Address
                </h3>
                <p className="font-semibold">{selectedOrder.deliveryAddress?.name}</p>
                <p className="text-muted-foreground text-xs">{selectedOrder.deliveryAddress?.address}</p>
                <p className="text-muted-foreground text-xs">
                  {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.country}
                </p>
                <p className="text-muted-foreground text-xs flex items-center gap-1 pt-1">
                  <Phone className="w-3 h-3" /> {selectedOrder.deliveryAddress?.phone || 'N/A'}
                </p>
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {selectedOrder.customerEmail || selectedOrder.userId}
                </p>
              </div>

              {/* Payment Summary */}
              <div className="space-y-2 border p-4 bg-muted/10">
                <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" /> Payment Summary
                </h3>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>Method:</span>
                  <span className="font-medium text-foreground">Flutterwave (Standard)</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Created:</span>
                  <span className="font-mono">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-3 border-t">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-primary font-bold">
                    UGX {Number(selectedOrder.total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" /> Ordered Items ({selectedOrder.items?.length || 0})
              </h3>
              <div className="border divide-y">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center gap-4 text-sm">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover border"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Unit Price: {formatMoney(item.unitPrice ?? item.price ?? 0, item.currency || selectedOrder.currency || 'UGX')}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="font-semibold">{formatMoney(Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity || 0), item.currency || selectedOrder.currency || 'UGX')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="rounded-none text-xs uppercase tracking-wider"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
