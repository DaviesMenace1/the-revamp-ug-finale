export const SHIPMENT_STATUSES = [
  'awaiting_payment',
  'processing',
  'packed',
  'assigned',
  'out_for_delivery',
  'ready_for_pickup',
  'delivered',
  'collected',
  'exception',
  'cancelled',
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  processing: 'Processing',
  packed: 'Packed',
  assigned: 'Assigned',
  out_for_delivery: 'Out for delivery',
  ready_for_pickup: 'Ready for pickup',
  delivered: 'Delivered',
  collected: 'Collected',
  exception: 'Delivery exception',
  cancelled: 'Cancelled',
}

export const SHIPMENT_STATUS_DESCRIPTIONS: Record<ShipmentStatus, string> = {
  awaiting_payment: 'The order is waiting for payment confirmation.',
  processing: 'The order is being prepared.',
  packed: 'The order has been packed and is ready for handover.',
  assigned: 'A delivery team member has been assigned.',
  out_for_delivery: 'The order is on its way to the delivery address.',
  ready_for_pickup: 'The order is ready to collect at the selected station.',
  delivered: 'The order was delivered to the recipient.',
  collected: 'The order was collected from the selected station.',
  exception: 'The delivery team needs attention before the order can continue.',
  cancelled: 'The shipment was cancelled.',
}

export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  awaiting_payment: ['processing', 'cancelled'],
  processing: ['packed', 'exception', 'cancelled'],
  packed: ['assigned', 'out_for_delivery', 'ready_for_pickup', 'exception', 'cancelled'],
  assigned: ['out_for_delivery', 'exception', 'cancelled'],
  out_for_delivery: ['delivered', 'exception', 'cancelled'],
  ready_for_pickup: ['collected', 'exception', 'cancelled'],
  delivered: [],
  collected: [],
  exception: ['processing', 'packed', 'assigned', 'out_for_delivery', 'ready_for_pickup', 'cancelled'],
  cancelled: [],
}

export function canTransitionShipment(from: ShipmentStatus, to: ShipmentStatus) {
  return from === to || SHIPMENT_TRANSITIONS[from].includes(to)
}

export function orderStatusForShipment(status: ShipmentStatus) {
  if (status === 'cancelled') return 'cancelled' as const
  if (status === 'delivered' || status === 'collected') return 'delivered' as const
  if (status === 'out_for_delivery' || status === 'ready_for_pickup') return 'shipped' as const
  if (status === 'processing' || status === 'packed' || status === 'assigned' || status === 'exception') return 'processing' as const
  return 'pending' as const
}
