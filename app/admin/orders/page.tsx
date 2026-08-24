import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import OrdersClient from './orders-client'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
  })

  // Parse JSON fields safely before passing to client
  const formattedOrders = allOrders.map((order) => ({
    ...order,
    items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [],
    deliveryAddress:
      typeof order.deliveryAddress === 'string'
        ? JSON.parse(order.deliveryAddress)
        : order.deliveryAddress || {},
  }))

  return <OrdersClient initialOrders={formattedOrders} />
}




// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react'
// import { Input } from '@/components/ui/input'

// const orders = [
//   { id: '#ORD-5847', customer: 'Sarah Kiwanuka', amount: 'UGX 2.5M', status: 'Delivered', date: '2026-08-20' },
//   { id: '#ORD-5846', customer: 'James Mutua', amount: 'UGX 890K', status: 'In Transit', date: '2026-08-18' },
//   { id: '#ORD-5845', customer: 'Emma Rodriguez', amount: 'UGX 3.2M', status: 'Processing', date: '2026-08-19' },
//   { id: '#ORD-5844', customer: 'David Kiprotich', amount: 'UGX 1.2M', status: 'Pending', date: '2026-08-17' },
//   { id: '#ORD-5843', customer: 'Hotel Management', amount: 'UGX 5.8M', status: 'Delivered', date: '2026-08-15' },
// ]

// export default function AdminOrders() {
//   return (
//     <div className="space-y-8 p-8">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="font-serif text-4xl font-light text-foreground">Orders</h1>
//           <p className="text-muted-foreground mt-2">Monitor and manage all orders</p>
//         </div>
//         <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
//           <Plus className="w-4 h-4 mr-2" />
//           New Order
//         </Button>
//       </div>

//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Recent Orders</CardTitle>
//               <CardDescription>{orders.length} orders this week</CardDescription>
//             </div>
//             <div className="relative w-64">
//               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
//               <Input placeholder="Search orders..." className="pl-10 rounded-none border-muted" />
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="border-b border-border/20">
//                 <tr>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Order ID</th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Customer</th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Amount</th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Status</th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Date</th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {orders.map(order => (
//                   <tr key={order.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
//                     <td className="py-4 px-4 text-sm font-mono text-foreground">{order.id}</td>
//                     <td className="py-4 px-4 text-sm text-muted-foreground">{order.customer}</td>
//                     <td className="py-4 px-4 text-sm font-medium text-foreground">{order.amount}</td>
//                     <td className="py-4 px-4 text-sm">
//                       <span
//                         className={`px-3 py-1 rounded-full text-xs font-medium ${
//                           order.status === 'Delivered'
//                             ? 'bg-green-100 text-green-800'
//                             : order.status === 'In Transit'
//                               ? 'bg-blue-100 text-blue-800'
//                               : order.status === 'Processing'
//                                 ? 'bg-purple-100 text-purple-800'
//                                 : 'bg-orange-100 text-orange-800'
//                         }`}
//                       >
//                         {order.status}
//                       </span>
//                     </td>
//                     <td className="py-4 px-4 text-sm text-muted-foreground">{order.date}</td>
//                     <td className="py-4 px-4 text-sm flex gap-2">
//                       <button className="p-1.5 hover:bg-muted rounded transition-colors">
//                         <Eye className="w-4 h-4 text-muted-foreground" />
//                       </button>
//                       <button className="p-1.5 hover:bg-muted rounded transition-colors">
//                         <Edit className="w-4 h-4 text-muted-foreground" />
//                       </button>
//                       <button className="p-1.5 hover:bg-muted rounded transition-colors">
//                         <Trash2 className="w-4 h-4 text-muted-foreground" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
