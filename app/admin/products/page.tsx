import Link from "next/link"
import Image from "next/image"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Archive,
  ExternalLink,
  Pencil,
} from "lucide-react"

import { db } from "@/lib/db"
import {
  products,
  productImages,
  subCategories,
  categories,
  departments,
} from "@/lib/db/schema"

export const dynamic = "force-dynamic"
export const revalidate = 0

function formatUGX(value: string | number | null | undefined) {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(value ?? "0")

  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case "published":
      return "Published"
    case "ready_for_review":
      return "Ready for Review"
    case "archived":
      return "Archived"
    default:
      return "Draft"
  }
}

function statusClass(status: string | null | undefined) {
  switch (status) {
    case "published":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "ready_for_review":
      return "border-amber-200 bg-amber-50 text-amber-800"
    case "archived":
      return "border-stone-200 bg-stone-100 text-stone-600"
    default:
      return "border-blue-200 bg-blue-50 text-blue-700"
  }
}

function googleStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "synced":
      return "Synced"
    case "pending":
      return "Pending"
    case "failed":
      return "Sync Failed"
    case "not_synced":
      return "Not Synced"
    default:
      return "Not Synced"
  }
}

function googleStatusClass(status: string | null | undefined) {
  switch (status) {
    case "synced":
      return "text-emerald-700"
    case "pending":
      return "text-amber-700"
    case "failed":
      return "text-rose-700"
    default:
      return "text-stone-500"
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string
    status?: string
    availability?: string
  }>
}) {
  const params = searchParams ? await searchParams : {}

  const query = params.q?.trim() ?? ""
  const status = params.status ?? "all"
  const availability = params.availability ?? "all"

  const conditions = []

  if (query) {
    conditions.push(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.sku, `%${query}%`),
        ilike(products.slug, `%${query}%`),
        ilike(products.brand, `%${query}%`),
      ),
    )
  }

  if (
    status === "draft" ||
    status === "ready_for_review" ||
    status === "published" ||
    status === "archived"
  ) {
    conditions.push(eq(products.status, status))
  }

  if (
    availability === "in_stock" ||
    availability === "made_to_order" ||
    availability === "pre_order" ||
    availability === "out_of_stock" ||
    availability === "available_on_request"
  ) {
    conditions.push(eq(products.availability, availability))
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      originalPrice: products.originalPrice,
      status: products.status,
      availability: products.availability,
      quantity: products.quantity,
      inStock: sql<boolean>`${products.availability} = 'in_stock'`,
      googleSyncStatus: products.googleSyncStatus,
      googleSyncError: products.googleSyncError,
      updatedAt: products.updatedAt,

      subCategoryId: subCategories.id,
      subCategoryName: subCategories.name,

      categoryName: categories.name,
      departmentName: departments.name,

      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(
      subCategories,
      eq(products.subCategoryId, subCategories.id),
    )
    .leftJoin(
      categories,
      eq(subCategories.categoryId, categories.id),
    )
    .leftJoin(
      departments,
      eq(categories.departmentId, departments.id),
    )
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.updatedAt))

  const allProducts = await db
    .select({
      id: products.id,
      status: products.status,
      availability: products.availability,
      googleSyncStatus: products.googleSyncStatus,
    })
    .from(products)

  const totalProducts = allProducts.length
  const publishedProducts = allProducts.filter(
    (product) => product.status === "published",
  ).length
  const reviewProducts = allProducts.filter(
    (product) => product.status === "ready_for_review",
  ).length
  const draftProducts = allProducts.filter(
    (product) => product.status === "draft",
  ).length
  const googleIssues = allProducts.filter(
    (product) =>
      product.googleSyncStatus === "failed" ||
      product.googleSyncStatus === "not_synced" ||
      !product.googleSyncStatus,
  ).length

  return (
    <div className="min-h-screen bg-stone-50/60">
      <div className="mx-auto max-w-[1600px] space-y-6 p-5 sm:p-8">
        <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-stone-500">
              The Revamp UG · Catalog
            </p>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
              Products
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Manage products, category-specific specifications, variants,
              inventory, images, and Google Merchant readiness.
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Total Products"
            value={totalProducts}
            icon={<Package className="h-4 w-4" />}
          />

          <StatCard
            label="Published"
            value={publishedProducts}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />

          <StatCard
            label="Needs Review"
            value={reviewProducts}
            icon={<Clock3 className="h-4 w-4" />}
          />

          <StatCard
            label="Drafts"
            value={draftProducts}
            icon={<Pencil className="h-4 w-4" />}
          />

          <StatCard
            label="Google Issues"
            value={googleIssues}
            icon={<AlertCircle className="h-4 w-4" />}
            danger={googleIssues > 0}
          />
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <form
            method="GET"
            className="flex flex-col gap-3 xl:flex-row xl:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

              <input
                name="q"
                defaultValue={query}
                placeholder="Search by product name, SKU, slug or brand..."
                className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="ready_for_review">Ready for Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <select
              name="availability"
              defaultValue={availability}
              className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400"
            >
              <option value="all">All availability</option>
              <option value="in_stock">In Stock</option>
              <option value="made_to_order">Made to Order</option>
              <option value="pre_order">Pre-Order</option>
              <option value="available_on_request">
                Available on Request
              </option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <button
              type="submit"
              className="h-10 rounded-lg bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Search
            </button>

            {(query || status !== "all" || availability !== "all") && (
              <Link
                href="/admin/products"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 px-4 text-sm text-stone-600 hover:bg-stone-50"
              >
                Clear
              </Link>
            )}
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Product Catalog
              </h2>

              <p className="mt-1 text-xs text-stone-500">
                {rows.length} product{rows.length === 1 ? "" : "s"} shown
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                <Package className="h-5 w-5 text-stone-400" />
              </div>

              <h3 className="text-sm font-semibold text-stone-900">
                No products found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-stone-500">
                {query || status !== "all" || availability !== "all"
                  ? "Try changing your filters."
                  : "Create your first product to start building the catalog."}
              </p>

              <Link
                href="/admin/products/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Create Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="border-b border-stone-200 bg-stone-50">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Taxonomy</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Availability</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Google</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {rows.map((product) => (
                    <tr
                      key={product.id}
                      className="group transition hover:bg-stone-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-4 w-4 text-stone-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.productId}`}
                              className="block max-w-[280px] truncate text-sm font-medium text-stone-900 hover:text-stone-600"
                            >
                              {product.name}
                            </Link>

                            <p className="mt-1 text-[11px] font-mono text-stone-400">
                              {product.sku || "No SKU"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-stone-700">
                          {product.departmentName || "—"}
                        </div>

                        <div className="mt-1 text-[11px] text-stone-400">
                          {product.categoryName || "—"}
                          {product.subCategoryName
                            ? ` → ${product.subCategoryName}`
                            : ""}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-stone-900">
                          {formatUGX(product.price)}
                        </div>

                        {product.originalPrice &&
                          Number(product.originalPrice) >
                            Number(product.price) && (
                            <div className="mt-1 text-[11px] text-stone-400 line-through">
                              {formatUGX(product.originalPrice)}
                            </div>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        <AvailabilityBadge
                          availability={product.availability}
                          quantity={product.quantity}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClass(
                            product.status,
                          )}`}
                        >
                          {statusLabel(product.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-medium ${googleStatusClass(
                            product.googleSyncStatus,
                          )}`}
                        >
                          {product.googleSyncStatus === "synced" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : product.googleSyncStatus === "failed" ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                          ) : product.googleSyncStatus === "pending" ? (
                            <Clock3 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}

                          {googleStatusLabel(product.googleSyncStatus)}
                        </div>

                        {product.googleSyncError && (
                          <p className="mt-1 max-w-[180px] truncate text-[10px] text-rose-500">
                            {product.googleSyncError}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 px-3 text-xs font-medium text-stone-700 hover:bg-stone-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>

                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                            aria-label={`View ${product.name}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${
          danger ? "bg-rose-50 text-rose-600" : "bg-stone-100 text-stone-600"
        }`}
      >
        {icon}
      </div>

      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">
        {value}
      </p>
    </div>
  )
}

function AvailabilityBadge({
  availability,
  quantity,
}: {
  availability: string | null | undefined
  quantity: number | null | undefined
}) {
  const label =
    availability === "in_stock"
      ? `In Stock${quantity !== null && quantity !== undefined ? ` (${quantity})` : ""}`
      : availability === "made_to_order"
        ? "Made to Order"
        : availability === "pre_order"
          ? "Pre-Order"
          : availability === "out_of_stock"
            ? "Out of Stock"
            : "Available on Request"

  const className =
    availability === "in_stock"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : availability === "made_to_order"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : availability === "pre_order"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : availability === "out_of_stock"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-stone-200 bg-stone-100 text-stone-600"

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${className}`}
    >
      {label}
    </span>
  )
}

