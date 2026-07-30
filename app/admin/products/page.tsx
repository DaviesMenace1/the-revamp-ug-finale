import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const products = [
  { id: 1, name: 'Savannah Modular Sofa', category: 'Seating', price: 'UGX 3.2M', stock: 12, status: 'Active' },
  { id: 2, name: 'Aria Lounge Chair', category: 'Seating', price: 'UGX 1.8M', stock: 8, status: 'Active' },
  { id: 3, name: 'Horizon Coffee Table', category: 'Tables', price: 'UGX 890K', stock: 5, status: 'Low Stock' },
  { id: 4, name: 'Eclipse Floor Lamp', category: 'Lighting', price: 'UGX 450K', stock: 0, status: 'Out of Stock' },
  { id: 5, name: 'Luxe Area Rug', category: 'Textiles', price: 'UGX 2.1M', stock: 3, status: 'Low Stock' },
]

export default function AdminProducts() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Products</h1>
          <p className="text-muted-foreground mt-2">Manage your product catalogue</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Products</CardTitle>
              <CardDescription>{products.length} products in total</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10 rounded-none border-muted" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/20">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Product Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm text-foreground">{product.name}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{product.category}</td>
                    <td className="py-4 px-4 text-sm font-medium text-foreground">{product.price}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{product.stock} units</td>
                    <td className="py-4 px-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'Low Stock'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm flex gap-2">
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
