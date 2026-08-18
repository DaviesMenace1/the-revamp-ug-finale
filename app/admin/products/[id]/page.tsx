"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CldUploadWidget } from "next-cloudinary"
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Trash2,
  AlertCircle,
} from "lucide-react"

type Product = {
  id: string
  name: string
  slug: string
  sku: string
  mpn?: string | null
  gtin?: string | null
  brand?: string | null
  manufacturer?: string | null
  countryOfOrigin?: string | null

  departmentId?: string | null
  categoryId?: string | null
  subCategoryId?: string | null

  productType?: string | null
  description?: string | null
  longDescription?: string | null
  editorialHighlight?: string | null

  price?: string | number | null
  originalPrice?: string | number | null
  currency?: string | null

  condition?: string | null
  availability?: string | null
  inStock?: boolean | null
  quantity?: number | null
  leadTime?: string | null

  weight?: string | number | null
  weightUnit?: string | null

  googleProductCategoryId?: string | null
  googleProductCategoryPath?: string | null
  canonicalUrl?: string | null

  seoTitle?: string | null
  seoDescription?: string | null

  featured?: boolean | null
  isNewArrival?: boolean | null
  isBestSeller?: boolean | null
  isOnSale?: boolean | null

  status: "draft" | "ready_for_review" | "published" | "archived"

  attributes?: Record<string, unknown> | null

  googleSyncStatus?: string | null
  googleSyncError?: string | null

  productImages?: ProductImage[]
  productVariants?: ProductVariant[]
}

type LibraryItem = {
  id: string
  name: string
  hex?: string | null
  swatchImage?: string | null
}

type ProductImage = {
  id: string
  productId: string
  variantId: string | null
  url: string
  altText: string | null
  isPrimary: boolean
  displayOrder: number
}

type ProductVariant = {
  id: string
  productId: string
  type: "COLOR" | "FABRIC" | "MATERIAL" | "SIZE"
  label: string
  value: string
  sku: string | null
  priceDelta: string | number | null
  quantity: number
  availability: string
  colorId: string | null
  fabricId: string | null
  materialId: string | null
}

type TaxonomyItem = {
  id: string
  name: string
  slug: string
}

type Category = TaxonomyItem & {
  departmentId: string
}

type SubCategory = TaxonomyItem & {
  categoryId: string
  googleProductCategoryId?: string | null
  googleProductCategoryPath?: string | null
  templateSchema?: TemplateSchema | null
}

type AttributeField = {
  key: string
  label: string
  type:
    | "text"
    | "textarea"
    | "number"
    | "measurement"
    | "select"
    | "multiselect"
    | "boolean"
    | "color"
    | "fabric"
    | "material"
    | "finish"
  required?: boolean
  placeholder?: string
  unit?: string
  options?: {
    label: string
    value: string
  }[]
}

type AttributeGroup = {
  key: string
  label: string
  description?: string
  fields: AttributeField[]
}

type TemplateSchema = {
  version?: number
  groups?: AttributeGroup[]
  fields?: AttributeField[]
}

const inputClass =
  "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 disabled:bg-stone-50"

const textareaClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm leading-6 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()

  const id = String(params.id)

  const [product, setProduct] = useState<Product | null>(null)

  const [departments, setDepartments] = useState<TaxonomyItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])

  const [libraries, setLibraries] = useState<{
    colors: LibraryItem[]
    materials: LibraryItem[]
    fabrics: LibraryItem[]
    finishes: LibraryItem[]
  }>({ colors: [], materials: [], fabrics: [], finishes: [] })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [syncingGoogle, setSyncingGoogle] = useState(false)

  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const productId = params?.id ? String(params.id) : null

  // Guard: Stop execution if params are not yet available or named incorrectly
  if (!productId || productId === "undefined") return
    async function load() {
      try {
        setLoading(true)

        const [productResponse, taxonomyResponse, librariesResponse] = await Promise.all([
          fetch(`/api/admin/products/${id}`, {
            cache: "no-store",
          }),
          fetch("/api/admin/product-taxonomy", {
            cache: "no-store",
          }),
          fetch("/api/admin/product-libraries", {
            cache: "no-store",
          }),
        ])

        const productData = await productResponse.json()
        const taxonomyData = await taxonomyResponse.json()
        const librariesData = await librariesResponse.json()

        if (!productResponse.ok) {
          throw new Error(
            productData?.error || "Failed to load product.",
          )
        }

        if (!taxonomyResponse.ok) {
          throw new Error(
            taxonomyData?.error || "Failed to load taxonomy.",
          )
        }

        setProduct(productData.product)

        setDepartments(taxonomyData.departments ?? [])
        setCategories(taxonomyData.categories ?? [])
        setSubCategories(taxonomyData.subCategories ?? [])

        if (librariesResponse.ok) {
          setLibraries({
            colors: librariesData.colors ?? [],
            materials: librariesData.materials ?? [],
            fabrics: librariesData.fabrics ?? [],
            finishes: librariesData.finishes ?? [],
          })
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load product.",
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const filteredCategories = useMemo(() => {
    if (!product?.departmentId) return []

    return categories.filter(
      (category) =>
        category.departmentId === product.departmentId,
    )
  }, [categories, product?.departmentId])

  const filteredSubCategories = useMemo(() => {
    if (!product?.categoryId) return []

    return subCategories.filter(
      (subCategory) =>
        subCategory.categoryId === product.categoryId,
    )
  }, [subCategories, product?.categoryId])

  const selectedSubCategory = useMemo(() => {
    if (!product?.subCategoryId) return null

    return subCategories.find(
      (item) => item.id === product.subCategoryId,
    )
  }, [subCategories, product?.subCategoryId])

  const templateSchema = selectedSubCategory?.templateSchema ?? null

  function update<K extends keyof Product>(
    key: K,
    value: Product[K],
  ) {
    setProduct((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    )
  }

  function updateAttribute(
    key: string,
    value: unknown,
  ) {
    setProduct((current) =>
      current
        ? {
            ...current,
            attributes: {
              ...(current.attributes ?? {}),
              [key]: value,
            },
          }
        : current,
    )
  }

  async function save(status?: Product["status"]) {
    if (!product) return

    setError("")
    setMessage("")

    if (!product.name.trim()) {
      setError("Product name is required.")
      return
    }

    if (!product.sku.trim()) {
      setError("SKU is required.")
      return
    }

    if (!product.departmentId) {
      setError("Department is required.")
      return
    }

    if (!product.categoryId) {
      setError("Category is required.")
      return
    }

    if (!product.subCategoryId) {
      setError("Subcategory is required.")
      return
    }

    try {
      setSaving(true)

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...product,
            status: status ?? product.status,
            price: Number(product.price ?? 0),
            originalPrice:
              product.originalPrice === null ||
              product.originalPrice === ""
                ? null
                : Number(product.originalPrice),
            quantity: Number(product.quantity ?? 0),
            weight:
              product.weight === null ||
              product.weight === ""
                ? null
                : Number(product.weight),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to save product.",
        )
      }

      setProduct(data.product)
      setMessage("Product saved successfully.")

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save product.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function syncToGoogle() {
    if (!product) return

    setError("")
    setMessage("")

    try {
      setSyncingGoogle(true)

      const response = await fetch(
        `/api/admin/products/${product.id}/sync-google`,
        { method: "POST" },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to sync product to Google Merchant.",
        )
      }

      setProduct((current) =>
        current
          ? {
              ...current,
              googleSyncStatus: "synced",
              googleSyncError: null,
            }
          : current,
      )

      setMessage(
        data.warnings?.length
          ? `Synced to Google Merchant with warnings: ${data.warnings.join(" ")}`
          : "Synced to Google Merchant successfully.",
      )
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to sync product to Google Merchant."

      setError(msg)

      setProduct((current) =>
        current
          ? {
              ...current,
              googleSyncStatus: "error",
              googleSyncError: msg,
            }
          : current,
      )
    } finally {
      setSyncingGoogle(false)
    }
  }

  const [uploadingImage, setUploadingImage] = useState(false)
  const [savingVariant, setSavingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({
    type: "COLOR" as ProductVariant["type"],
    label: "",
    value: "",
    colorId: "",
    fabricId: "",
    materialId: "",
    priceDelta: "0",
    quantity: "0",
  })

  async function attachImage(
    url: string,
    variantId?: string | null,
  ) {
    if (!product) return

    setError("")
    setMessage("")

    try {
      setUploadingImage(true)

      const saveResponse = await fetch(
        `/api/admin/products/${product.id}/images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            variantId: variantId || null,
          }),
        },
      )

      const saveData = await saveResponse.json()

      if (!saveResponse.ok || !saveData.success) {
        throw new Error(
          saveData?.error || "Failed to save image.",
        )
      }

      setProduct((current) =>
        current
          ? {
              ...current,
              productImages: [
                ...(current.productImages ?? []).map((img) =>
                  saveData.image.isPrimary
                    ? { ...img, isPrimary: false }
                    : img,
                ),
                saveData.image,
              ],
            }
          : current,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload image.",
      )
    } finally {
      setUploadingImage(false)
    }
  }

  async function setPrimaryImage(imageId: string) {
    if (!product) return

    const response = await fetch(
      `/api/admin/products/${product.id}/images`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, isPrimary: true }),
      },
    )

    if (!response.ok) return

    setProduct((current) =>
      current
        ? {
            ...current,
            productImages: (current.productImages ?? []).map((img) => ({
              ...img,
              isPrimary: img.id === imageId,
            })),
          }
        : current,
    )
  }

  async function deleteImage(imageId: string) {
    if (!product) return

    const response = await fetch(
      `/api/admin/products/${product.id}/images?imageId=${imageId}`,
      { method: "DELETE" },
    )

    if (!response.ok) return

    setProduct((current) =>
      current
        ? {
            ...current,
            productImages: (current.productImages ?? []).filter(
              (img) => img.id !== imageId,
            ),
          }
        : current,
    )
  }

  async function addVariant() {
    if (!product) return

    setError("")
    setMessage("")

    if (!newVariant.label.trim() || !newVariant.value.trim()) {
      setError("Variant label and value are required.")
      return
    }

    try {
      setSavingVariant(true)

      const response = await fetch(
        `/api/admin/products/${product.id}/variants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newVariant.type,
            label: newVariant.label,
            value: newVariant.value,
            colorId: newVariant.type === "COLOR" ? newVariant.colorId || null : null,
            fabricId: newVariant.type === "FABRIC" ? newVariant.fabricId || null : null,
            materialId: newVariant.type === "MATERIAL" ? newVariant.materialId || null : null,
            priceDelta: parseFloat(newVariant.priceDelta) || 0,
            quantity: parseInt(newVariant.quantity, 10) || 0,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || "Failed to add variant.")
      }

      setProduct((current) =>
        current
          ? {
              ...current,
              productVariants: [
                ...(current.productVariants ?? []),
                data.variant,
              ],
            }
          : current,
      )

      setNewVariant({
        type: "COLOR",
        label: "",
        value: "",
        colorId: "",
        fabricId: "",
        materialId: "",
        priceDelta: "0",
        quantity: "0",
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add variant.",
      )
    } finally {
      setSavingVariant(false)
    }
  }

  async function deleteVariant(variantId: string) {
    if (!product) return

    const response = await fetch(
      `/api/admin/products/${product.id}/variants?variantId=${variantId}`,
      { method: "DELETE" },
    )

    if (!response.ok) return

    setProduct((current) =>
      current
        ? {
            ...current,
            productVariants: (current.productVariants ?? []).filter(
              (v) => v.id !== variantId,
            ),
            productImages: (current.productImages ?? []).filter(
              (img) => img.variantId !== variantId,
            ),
          }
        : current,
    )
  }

  async function deleteProduct() {
    if (!product) return

    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      setError("")

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to delete product.",
        )
      }

      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product.",
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading product...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-base font-semibold text-rose-900">
            Product not found
          </h1>

          <p className="mt-2 text-sm text-rose-700">
            {error || "The requested product could not be loaded."}
          </p>

          <Link
            href="/admin/products"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-stone-950 px-4 py-2 text-sm font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50/60">
      <div className="mx-auto max-w-6xl p-5 pb-32 sm:p-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/products"
              className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-500 hover:text-stone-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
              Edit Product
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              {product.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />

            {product.slug && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Product
              </Link>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </div>
        )}

        <div className="space-y-6">
          <Section
            title="Product Identity"
            description="Core product information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Product Name" required>
                <input
                  value={product.name}
                  onChange={(e) =>
                    update("name", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="SKU" required>
                <input
                  value={product.sku}
                  onChange={(e) =>
                    update(
                      "sku",
                      e.target.value.toUpperCase(),
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Slug" required>
                <input
                  value={product.slug}
                  onChange={(e) =>
                    update("slug", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Product Type">
                <select
                  value={product.productType ?? "standard"}
                  onChange={(e) =>
                    update("productType", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="standard">Standard</option>
                  <option value="made_to_order">
                    Made to Order
                  </option>
                  <option value="custom_bespoke">
                    Custom / Bespoke
                  </option>
                  <option value="sourced_on_request">
                    Sourced on Request
                  </option>
                  <option value="pre_order">Pre-Order</option>
                  <option value="set">Set</option>
                  <option value="bundle">Bundle</option>
                  <option value="sample">Sample</option>
                </select>
              </Field>

              <Field label="Brand">
                <input
                  value={product.brand ?? ""}
                  onChange={(e) =>
                    update("brand", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Manufacturer">
                <input
                  value={product.manufacturer ?? ""}
                  onChange={(e) =>
                    update(
                      "manufacturer",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="MPN">
                <input
                  value={product.mpn ?? ""}
                  onChange={(e) =>
                    update("mpn", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="GTIN">
                <input
                  value={product.gtin ?? ""}
                  onChange={(e) =>
                    update("gtin", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Country of Origin">
                <input
                  value={product.countryOfOrigin ?? ""}
                  onChange={(e) =>
                    update(
                      "countryOfOrigin",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Product Taxonomy"
            description="Changing the subcategory can change the specification fields required for this product."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Department" required>
                <select
                  value={product.departmentId ?? ""}
                  onChange={(e) =>
                    setProduct((current) =>
                      current
                        ? {
                            ...current,
                            departmentId:
                              e.target.value,
                            categoryId: "",
                            subCategoryId: "",
                            attributes: {},
                          }
                        : current,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category" required>
                <select
                  value={product.categoryId ?? ""}
                  onChange={(e) =>
                    setProduct((current) =>
                      current
                        ? {
                            ...current,
                            categoryId:
                              e.target.value,
                            subCategoryId: "",
                            attributes: {},
                          }
                        : current,
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select category
                  </option>

                  {filteredCategories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subcategory" required>
                <select
                  value={product.subCategoryId ?? ""}
                  onChange={(e) => {
                    const selected =
                      subCategories.find(
                        (item) =>
                          item.id === e.target.value,
                      )

                    setProduct((current) =>
                      current
                        ? {
                            ...current,
                            subCategoryId:
                              e.target.value,
                            googleProductCategoryId:
                              selected?.googleProductCategoryId ??
                              null,
                            googleProductCategoryPath:
                              selected?.googleProductCategoryPath ??
                              null,
                            attributes: {},
                          }
                        : current,
                    )
                  }}
                  className={inputClass}
                >
                  <option value="">
                    Select subcategory
                  </option>

                  {filteredSubCategories.map(
                    (subCategory) => (
                      <option
                        key={subCategory.id}
                        value={subCategory.id}
                      >
                        {subCategory.name}
                      </option>
                    ),
                  )}
                </select>
              </Field>
            </div>

            {selectedSubCategory && (
              <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-medium text-stone-900">
                  {selectedSubCategory.name}
                </p>

                {selectedSubCategory.googleProductCategoryPath && (
                  <p className="mt-1 text-xs text-stone-500">
                    Google category:{" "}
                    {selectedSubCategory.googleProductCategoryPath}
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section
            title="Description"
            description="Customer-facing product content."
          >
            <div className="space-y-5">
              <Field label="Short Description">
                <textarea
                  value={product.description ?? ""}
                  onChange={(e) =>
                    update(
                      "description",
                      e.target.value,
                    )
                  }
                  rows={4}
                  className={textareaClass}
                />
              </Field>

              <Field label="Long Description">
                <textarea
                  value={product.longDescription ?? ""}
                  onChange={(e) =>
                    update(
                      "longDescription",
                      e.target.value,
                    )
                  }
                  rows={8}
                  className={textareaClass}
                />
              </Field>

              <Field label="Editorial Highlight">
                <textarea
                  value={
                    product.editorialHighlight ?? ""
                  }
                  onChange={(e) =>
                    update(
                      "editorialHighlight",
                      e.target.value,
                    )
                  }
                  rows={3}
                  className={textareaClass}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Pricing & Availability"
            description="Commercial and stock information."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Price" required>
                <input
                  type="number"
                  min="0"
                  value={product.price ?? ""}
                  onChange={(e) =>
                    update("price", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Original Price">
                <input
                  type="number"
                  min="0"
                  value={product.originalPrice ?? ""}
                  onChange={(e) =>
                    update(
                      "originalPrice",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <select
                  value={product.currency ?? "UGX"}
                  onChange={(e) =>
                    update("currency", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="UGX">UGX</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </Field>

              <Field label="Availability">
                <select
                  value={
                    product.availability ??
                    "in_stock"
                  }
                  onChange={(e) =>
                    update(
                      "availability",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="in_stock">
                    In Stock
                  </option>
                  <option value="made_to_order">
                    Made to Order
                  </option>
                  <option value="pre_order">
                    Pre-Order
                  </option>
                  <option value="available_on_request">
                    Available on Request
                  </option>
                  <option value="out_of_stock">
                    Out of Stock
                  </option>
                </select>
              </Field>

              <Field label="Quantity">
                <input
                  type="number"
                  min="0"
                  value={product.quantity ?? 0}
                  onChange={(e) =>
                    update(
                      "quantity",
                      Number(e.target.value),
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Lead Time">
                <input
                  value={product.leadTime ?? ""}
                  onChange={(e) =>
                    update(
                      "leadTime",
                      e.target.value,
                    )
                  }
                  placeholder="e.g. 6–8 weeks"
                  className={inputClass}
                />
              </Field>

              <Field label="Weight">
                <input
                  type="number"
                  min="0"
                  value={product.weight ?? ""}
                  onChange={(e) =>
                    update(
                      "weight",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Weight Unit">
                <select
                  value={product.weightUnit ?? "kg"}
                  onChange={(e) =>
                    update(
                      "weightUnit",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                </select>
              </Field>
            </div>
          </Section>

          {templateSchema && (
            <Section
              title="Product Specifications"
              description={`Category-specific specifications for ${selectedSubCategory?.name ?? "this product"}.`}
            >
              <DynamicAttributes
                schema={templateSchema}
                values={product.attributes ?? {}}
                onChange={updateAttribute}
                libraries={libraries}
              />
            </Section>
          )}

          <Section
            title="Product Images"
            description="Photos shown in the storefront gallery. The starred image is the primary/thumbnail image."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {(product.productImages ?? [])
                  .filter((img) => !img.variantId)
                  .map((img) => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-lg border border-stone-200"
                    >
                      <img
                        src={img.url}
                        alt={img.altText ?? product.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(img.id)}
                          className={`rounded px-2 py-1 text-[10px] font-medium ${
                            img.isPrimary
                              ? "bg-amber-400 text-stone-900"
                              : "bg-white/90 text-stone-700 hover:bg-white"
                          }`}
                        >
                          {img.isPrimary ? "Primary" : "Set primary"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteImage(img.id)}
                          className="rounded bg-white/90 p-1 text-rose-600 hover:bg-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              <CldUploadWidget
                uploadPreset={
                  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
                  "revamp_preset"
                }
                onSuccess={(result: any) => {
                  const url = result?.info?.secure_url
                  if (url) attachImage(url)
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => open()}
                    className="flex h-10 w-fit items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>+ Upload image</span>
                    )}
                  </button>
                )}
              </CldUploadWidget>
            </div>
          </Section>

          <Section
            title="Variants"
            description="Color, fabric, material, or size options for this product. Each variant can have its own image, shown to customers when they select it."
          >
            <div className="space-y-5">
              {(product.productVariants ?? []).length > 0 && (
                <div className="space-y-3">
                  {(product.productVariants ?? []).map((variant) => {
                    const variantImages = (product.productImages ?? []).filter(
                      (img) => img.variantId === variant.id,
                    )

                    return (
                      <div
                        key={variant.id}
                        className="rounded-lg border border-stone-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {variant.type} · {variant.label}
                            </p>
                            <p className="text-xs text-stone-500">
                              Value: {variant.value}
                              {Number(variant.priceDelta) ? (
                                <> · +{variant.priceDelta}</>
                              ) : null}
                              {" · Qty: "}
                              {variant.quantity}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteVariant(variant.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {variantImages.map((img) => (
                            <div
                              key={img.id}
                              className="group relative h-16 w-16 overflow-hidden rounded border border-stone-200"
                            >
                              <img
                                src={img.url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => deleteImage(img.id)}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}

                          <CldUploadWidget
                            uploadPreset={
                              process.env
                                .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
                              "revamp_preset"
                            }
                            onSuccess={(result: any) => {
                              const url = result?.info?.secure_url
                              if (url) attachImage(url, variant.id)
                            }}
                          >
                            {({ open }) => (
                              <button
                                type="button"
                                disabled={uploadingImage}
                                onClick={() => open()}
                                className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-stone-300 text-[10px] text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                              >
                                {uploadingImage ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "+ Image"
                                )}
                              </button>
                            )}
                          </CldUploadWidget>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="mb-3 text-sm font-medium text-stone-900">
                  Add a variant
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Type">
                    <select
                      value={newVariant.type}
                      onChange={(e) =>
                        setNewVariant((v) => ({
                          ...v,
                          type: e.target.value as ProductVariant["type"],
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="COLOR">Color</option>
                      <option value="FABRIC">Fabric</option>
                      <option value="MATERIAL">Material</option>
                      <option value="SIZE">Size</option>
                    </select>
                  </Field>

                  <Field label="Label (shown to customers)">
                    <input
                      value={newVariant.label}
                      onChange={(e) =>
                        setNewVariant((v) => ({ ...v, label: e.target.value }))
                      }
                      placeholder="e.g. Natural Leather"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Value">
                    <input
                      value={newVariant.value}
                      onChange={(e) =>
                        setNewVariant((v) => ({ ...v, value: e.target.value }))
                      }
                      placeholder="e.g. #1C1C1C or Natural Leather"
                      className={inputClass}
                    />
                  </Field>

                  {newVariant.type === "COLOR" && (
                    <Field label="Linked color (library)">
                      <select
                        value={newVariant.colorId}
                        onChange={(e) =>
                          setNewVariant((v) => ({ ...v, colorId: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">None</option>
                        {libraries.colors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {newVariant.type === "FABRIC" && (
                    <Field label="Linked fabric (library)">
                      <select
                        value={newVariant.fabricId}
                        onChange={(e) =>
                          setNewVariant((v) => ({ ...v, fabricId: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">None</option>
                        {libraries.fabrics.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {newVariant.type === "MATERIAL" && (
                    <Field label="Linked material (library)">
                      <select
                        value={newVariant.materialId}
                        onChange={(e) =>
                          setNewVariant((v) => ({
                            ...v,
                            materialId: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="">None</option>
                        {libraries.materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field label="Price delta">
                    <input
                      type="number"
                      step="0.01"
                      value={newVariant.priceDelta}
                      onChange={(e) =>
                        setNewVariant((v) => ({
                          ...v,
                          priceDelta: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Quantity">
                    <input
                      type="number"
                      value={newVariant.quantity}
                      onChange={(e) =>
                        setNewVariant((v) => ({
                          ...v,
                          quantity: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  disabled={savingVariant}
                  onClick={addVariant}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-stone-900 px-4 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {savingVariant ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Add variant
                </button>
              </div>
            </div>
          </Section>

          <Section
            title="Google Merchant"
            description="Information used when preparing this product for Google Merchant Center."
          >
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Google Product Category ID">
                  <input
                    value={
                      product.googleProductCategoryId ??
                      ""
                    }
                    onChange={(e) =>
                      update(
                        "googleProductCategoryId",
                        e.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Google Product Category">
                  <input
                    value={
                      product.googleProductCategoryPath ??
                      ""
                    }
                    onChange={(e) =>
                      update(
                        "googleProductCategoryPath",
                        e.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Canonical URL">
                <input
                  value={product.canonicalUrl ?? ""}
                  onChange={(e) =>
                    update(
                      "canonicalUrl",
                      e.target.value,
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {product.googleSyncStatus ===
                    "synced" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : product.googleSyncStatus ===
                      "error" ||
                      product.googleSyncStatus ===
                      "rejected" ? (
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}

                    <p className="text-sm font-medium text-stone-900">
                      Google status:{" "}
                      {product.googleSyncStatus ??
                        "draft"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={syncingGoogle}
                    onClick={syncToGoogle}
                    className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {syncingGoogle ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Sync to Google
                  </button>
                </div>

                {product.googleSyncError && (
                  <p className="mt-2 text-xs leading-5 text-rose-600">
                    {product.googleSyncError}
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section
            title="SEO"
            description="Search metadata for the product page."
          >
            <div className="space-y-5">
              <Field label="SEO Title">
                <input
                  value={product.seoTitle ?? ""}
                  onChange={(e) =>
                    update(
                      "seoTitle",
                      e.target.value,
                    )
                  }
                  maxLength={70}
                  className={inputClass}
                />
              </Field>

              <Field label="SEO Description">
                <textarea
                  value={
                    product.seoDescription ?? ""
                  }
                  onChange={(e) =>
                    update(
                      "seoDescription",
                      e.target.value,
                    )
                  }
                  maxLength={160}
                  rows={4}
                  className={textareaClass}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Storefront Controls"
            description="Control how the product is presented throughout The Revamp UG."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Featured"
                description="Show in featured product sections."
                checked={Boolean(product.featured)}
                onChange={(value) =>
                  update("featured", value)
                }
              />

              <Toggle
                label="New Arrival"
                description="Show as a new catalogue arrival."
                checked={Boolean(product.isNewArrival)}
                onChange={(value) =>
                  update("isNewArrival", value)
                }
              />

              <Toggle
                label="Best Seller"
                description="Mark as a best-selling product."
                checked={Boolean(product.isBestSeller)}
                onChange={(value) =>
                  update("isBestSeller", value)
                }
              />

              <Toggle
                label="On Sale"
                description="Mark the product as discounted."
                checked={Boolean(product.isOnSale)}
                onChange={(value) =>
                  update("isOnSale", value)
                }
              />
            </div>
          </Section>

          <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-rose-900">
              Danger Zone
            </h2>

            <p className="mt-1 text-xs leading-5 text-stone-500">
              Deleting a product should only be used when you are certain it
              should no longer exist. Prefer archiving products that have
              historical orders.
            </p>

            <button
              type="button"
              disabled={deleting}
              onClick={deleteProduct}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Product
            </button>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/admin/products"
            className="text-sm font-medium text-stone-500 hover:text-stone-900"
          >
            Cancel
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => save("draft")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </button>

            {product.status !== "published" && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  save("ready_for_review")
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Ready for Review
              </button>
            )}

            {product.status === "ready_for_review" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => save("published")}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Publish
              </button>
            )}

            {product.status === "published" && (
              <button
                type="button"
                disabled={saving}
                onClick={() => save()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold text-stone-950">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-500">
          {description}
        </p>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-stone-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function DynamicAttributes({
  schema,
  values,
  onChange,
  libraries,
}: {
  schema: TemplateSchema
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  libraries?: {
    colors: LibraryItem[]
    materials: LibraryItem[]
    fabrics: LibraryItem[]
    finishes: LibraryItem[]
  }
}) {
  const allFields: AttributeField[] = schema.groups
    ? schema.groups.flatMap((group) => group.fields)
    : schema.fields ?? []

  function renderField(field: AttributeField) {
    const value = values?.[field.key]
    const commonClass = inputClass

    if (field.type === "textarea") {
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={textareaClass}
        />
      )
    }

    if (field.type === "boolean") {
      return (
        <label className="flex h-10 items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.key, e.target.checked)}
            className="h-4 w-4 rounded border-stone-300"
          />
          {field.label}
        </label>
      )
    }

    if (field.type === "number" || field.type === "measurement") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={commonClass}
          />
          {field.unit && (
            <span className="shrink-0 text-xs text-stone-500">
              {field.unit}
            </span>
          )}
        </div>
      )
    }

    if (field.type === "select") {
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={commonClass}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === "multiselect") {
      const selected = Array.isArray(value) ? (value as string[]) : []

      return (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange(
                    field.key,
                    active
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value],
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }

    if (
      field.type === "material" ||
      field.type === "fabric" ||
      field.type === "finish" ||
      field.type === "color"
    ) {
      const libraryKey =
        field.type === "material"
          ? "materials"
          : field.type === "fabric"
          ? "fabrics"
          : field.type === "finish"
          ? "finishes"
          : "colors"

      const items = libraries?.[libraryKey] ?? []

      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={commonClass}
        >
          <option value="">Select…</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        value={(value as string) ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={commonClass}
      />
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {allFields.map((field) => (
        <Field key={field.key} label={field.label} required={field.required}>
          {renderField(field)}
        </Field>
      ))}
    </div>
  )
}
