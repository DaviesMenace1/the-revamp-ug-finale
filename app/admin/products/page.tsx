import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  PackageX
} from 'lucide-react';
import { db } from '@/lib/db'; // Adjust path if your Drizzle instance export differs
import { products } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

// Ensures Next.js re-evaluates the page on request rather than statically caching stale DB data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper for formatting UGX currency (handles Drizzle string decimal types cleanly)
function formatUGX(amount: string | number | null | undefined) {
  if (!amount) return 'UGX 0';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(isNaN(numericAmount) ? 0 : numericAmount);
}

export default async function AdminProductsPage() {
  // Fetch products from database, ordered by latest update
  const productList = await db
    .select()
    .from(products)
    .orderBy(desc(products.updatedAt));

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 bg-stone-50/50 min-h-screen">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Product Catalog
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage store inventory, auto-generated SKUs, and live Google Merchant API sync.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Product</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg text-stone-700 bg-white hover:bg-stone-50">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Filter</span>
          </button>
          
          <span className="text-xs text-stone-400">|</span>

          <span className="text-xs font-mono text-stone-500">
            Total Products: <strong>{productList.length}</strong>
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {productList.length === 0 ? (
          /* Empty Database State */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
              <PackageX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800">No products found in database</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Your PostgreSQL database is currently empty. Get started by publishing your first luxury furniture item.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 bg-amber-800 text-white text-xs px-3.5 py-2 rounded-lg hover:bg-amber-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Real Database Records */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 border-collapse">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU / Taxonomy</th>
                  <th className="py-3 px-4">Price (UGX)</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Google Merchant Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {productList.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                    
                    {/* Product Name, Thumbnail & Published Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden relative flex-shrink-0">
                          {p.thumbnailImage ? (
                            <Image
                              src={p.thumbnailImage}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-mono">
                              NO IMG
                            </div>
                          )}
                        </div>
                        <div>
                          <Link 
                            href={`/admin/products/${p.id}`}
                            className="font-medium text-stone-900 hover:text-amber-800 transition-colors"
                          >
                            {p.name}
                          </Link>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            Status: <span className="capitalize font-mono">{p.status || 'draft'}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Auto-generated SKU & Category / SubCategory */}
                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      <span className="font-semibold text-stone-800">{p.sku}</span>
                      <p className="text-[10px] text-stone-400 font-sans mt-0.5">
                        {p.category} {p.subCategory ? `→ ${p.subCategory}` : ''}
                      </p>
                    </td>

                    {/* Base Price in UGX */}
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {formatUGX(p.price)}
                    </td>

                    {/* Stock & Availability Enum state */}
                    <td className="py-3.5 px-4">
                      {p.availability === 'in_stock' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          In Stock ({p.quantity ?? 0})
                        </span>
                      )}
                      {p.availability === 'made_to_order' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Made To Order {p.leadTime ? `(${p.leadTime})` : ''}
                        </span>
                      )}
                      {p.availability === 'pre_order' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Pre-Order
                        </span>
                      )}
                      {p.availability === 'out_of_stock' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                      {(!p.availability || p.availability === 'available_on_request') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                          On Request
                        </span>
                      )}
                    </td>

                    {/* Live Google Merchant API Sync Badge */}
                    <td className="py-3.5 px-4">
                      {p.googleSyncStatus === 'synced' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                        </span>
                      )}
                      {p.googleSyncStatus === 'error' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                            <AlertCircle className="w-3.5 h-3.5" /> Sync Error
                          </span>
                          <p className="text-[10px] text-rose-600 truncate max-w-[180px]" title={p.googleSyncError || ''}>
                            {p.googleSyncError || 'Validation failed'}
                          </p>
                        </div>
                      )}
                      {(!p.googleSyncStatus || p.googleSyncStatus === 'draft') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
                          <Clock className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="px-2.5 py-1 text-[11px] font-medium text-stone-700 border border-stone-200 rounded hover:bg-stone-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <button 
                          title="Force sync with Google Merchant API"
                          className="p-1 text-stone-400 hover:text-amber-800 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}


