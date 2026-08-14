"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Save,
  Send,
} from "lucide-react"

type TaxonomyItem = {
  id: string
  name: string
  slug: string
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
  options?: Array<{
    label: string
    value: string
  }>
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

type TaxonomyResponse = {
  departments: TaxonomyItem[]
  categories: Array<
    TaxonomyItem & {
      departmentId: string
    }
  >
  subCategories: Array<
    TaxonomyItem & {
      categoryId: string
      templateId?: string | null
      googleProductCategoryId?: string | null
      googleProductCategoryPath?: string | null
      templateSchema?: TemplateSchema | null
    }
  >
}

type ProductForm = {
  name: string
  slug: string
  sku: string
  mpn: string
  gtin: string
  brand: string
  manufacturer: string
  countryOfOrigin: string

  departmentId: string
  categoryId: string
  subCategoryId: string

  productType: string
  description: string
  longDescription: string
  editorialHighlight: string

  price: string
  originalPrice: string
  currency: string

  condition: string
  availability: string
  inStock: boolean
  quantity: string
  leadTime: string

  weight: string
  weightUnit: string

  googleProductCategoryId: string
  googleProductCategoryPath: string
  canonicalUrl: string

  seoTitle: string
  seoDescription: string

  featured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  isOnSale: boolean

  status: "draft" | "ready_for_review" | "published" | "archived"

  attributes: Record<string, unknown>
}

const INITIAL_FORM: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  mpn: "",
  gtin: "",
  brand: "The Revamp UG",
  manufacturer: "",
  countryOfOrigin: "Uganda",

  departmentId: "",
  categoryId: "",
  subCategoryId: "",

  productType: "standard",
  description: "",
  longDescription: "",
  editorialHighlight: "",

  price: "",
  originalPrice: "",
  currency: "UGX",

  condition: "new",
  availability: "in_stock",
  inStock: true,
  quantity: "0",
  leadTime: "",

  weight: "",
  weightUnit: "kg",

  googleProductCategoryId: "",
  googleProductCategoryPath: "",
  canonicalUrl: "",

  seoTitle: "",
  seoDescription: "",

  featured: false,
  isNewArrival: false,
  isBestSeller: false,
  isOnSale: false,

  status: "draft",

  attributes: {},
}

export default function NewProductPage() {
  const router = useRouter()

  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse>({
    departments: [],
    categories: [],
    subCategories: [],
  })

  const [form, setForm] = useState<ProductForm>(INITIAL_FORM)

  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        setLoadingTaxonomy(true)

        const response = await fetch("/api/admin/product-taxonomy", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to load product taxonomy")
        }

        const data = await response.json()

        setTaxonomy({
          departments: data.departments ?? [],
          categories: data.categories ?? [],
          subCategories: data.subCategories ?? [],
        })
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product categories.",
        )
      } finally {
        setLoadingTaxonomy(false)
      }
    }

    loadTaxonomy()
  }, [])

  const categories = useMemo(() => {
    if (!form.departmentId) return []

    return taxonomy.categories.filter(
      (category) => category.departmentId === form.departmentId,
    )
  }, [form.departmentId, taxonomy.categories])

  const subCategories = useMemo(() => {
    if (!form.categoryId) return []

    return taxonomy.subCategories.filter(
      (subCategory) => subCategory.categoryId === form.categoryId,
    )
  }, [form.categoryId, taxonomy.subCategories])

  const selectedSubCategory = useMemo(() => {
    return taxonomy.subCategories.find(
      (subCategory) => subCategory.id === form.subCategoryId,
    )
  }, [form.subCategoryId, taxonomy.subCategories])

  const templateSchema = selectedSubCategory?.templateSchema ?? null

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateAttribute(key: string, value: unknown) {
    setForm((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [key]: value,
      },
    }))
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        current.slug === "" || current.slug === slugify(current.name)
          ? slugify(value)
          : current.slug,
    }))
  }

  function handleDepartmentChange(value: string) {
    setForm((current) => ({
      ...current,
      departmentId: value,
      categoryId: "",
      subCategoryId: "",
      googleProductCategoryId: "",
      googleProductCategoryPath: "",
      attributes: {},
    }))
  }

  function handleCategoryChange(value: string) {
    setForm((current) => ({
      ...current,
      categoryId: value,
      subCategoryId: "",
      googleProductCategoryId: "",
      googleProductCategoryPath: "",
      attributes: {},
    }))
  }

  function handleSubCategoryChange(value: string) {
    const selected = taxonomy.subCategories.find(
      (item) => item.id === value,
    )

    setForm((current) => ({
      ...current,
      subCategoryId: value,
      googleProductCategoryId:
        selected?.googleProductCategoryId ?? "",
      googleProductCategoryPath:
        selected?.googleProductCategoryPath ?? "",
      attributes: {},
    }))
  }

  function validateBeforeSave() {
    if (!form.name.trim()) {
      return "Product name is required."
    }

    if (!form.sku.trim()) {
      return "SKU is required."
    }

    if (!form.departmentId) {
      return "Select a department."
    }

    if (!form.categoryId) {
      return "Select a category."
    }

    if (!form.subCategoryId) {
      return "Select a subcategory."
    }

    if (!form.price || Number(form.price) < 0) {
      return "Enter a valid product price."
    }

    const groups = templateSchema?.groups ?? []

    for (const group of groups) {
      for (const field of group.fields) {
        if (!field.required) continue

        const value = form.attributes[field.key]

        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return `${field.label} is required for ${selectedSubCategory?.name ?? "this product"}.`
        }
      }
    }

    return null
  }

  async function saveProduct(
    requestedStatus: ProductForm["status"] = form.status,
  ) {
    setError("")
    setSuccess("")

    const validationError = validateBeforeSave()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          status: requestedStatus,
          price: Number(form.price),
          originalPrice: form.originalPrice
            ? Number(form.originalPrice)
            : null,
          quantity: Number(form.quantity || 0),
          weight: form.weight ? Number(form.weight) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to create product.",
        )
      }

      setSuccess("Product created successfully.")

      if (data?.product?.id) {
        router.push(`/admin/products/${data.product.id}`)
        router.refresh()
        return
      }

      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the product.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loadingTaxonomy) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading product taxonomy...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50/60">
      <div className="mx-auto max-w-6xl p-5 pb-32 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/products"
              className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-500 hover:text-stone-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
              Add Product
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Build a product using the correct Revamp taxonomy and
              category-specific specifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-500">
              {form.status === "draft"
                ? "Draft"
                : form.status === "ready_for_review"
                  ? "Ready for Review"
                  : form.status === "published"
                    ? "Published"
                    : "Archived"}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <Section
            number="01"
            title="Product Identity"
            description="The core information customers and search engines use to identify this product."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Product Name" required>
                <input
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="e.g. Luna Curved Sofa"
                  className={inputClass}
                />
              </Field>

              <Field label="SKU" required>
                <input
                  value={form.sku}
                  onChange={(event) =>
                    updateField("sku", event.target.value.toUpperCase())
                  }
                  placeholder="e.g. RV-LUNA-001"
                  className={inputClass}
                />
              </Field>

              <Field label="Slug" required>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    updateField("slug", slugify(event.target.value))
                  }
                  placeholder="luna-curved-sofa"
                  className={inputClass}
                />
              </Field>

              <Field label="Product Type" required>
                <select
                  value={form.productType}
                  onChange={(event) =>
                    updateField("productType", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="standard">Standard</option>
                  <option value="made_to_order">Made to Order</option>
                  <option value="custom_bespoke">Custom / Bespoke</option>
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
                  value={form.brand}
                  onChange={(event) =>
                    updateField("brand", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Manufacturer">
                <input
                  value={form.manufacturer}
                  onChange={(event) =>
                    updateField("manufacturer", event.target.value)
                  }
                  placeholder="Manufacturer name"
                  className={inputClass}
                />
              </Field>

              <Field label="MPN">
                <input
                  value={form.mpn}
                  onChange={(event) =>
                    updateField("mpn", event.target.value)
                  }
                  placeholder="Manufacturer Part Number"
                  className={inputClass}
                />
              </Field>

              <Field label="GTIN">
                <input
                  value={form.gtin}
                  onChange={(event) =>
                    updateField("gtin", event.target.value)
                  }
                  placeholder="UPC / EAN / GTIN"
                  className={inputClass}
                />
              </Field>

              <Field label="Country of Origin">
                <input
                  value={form.countryOfOrigin}
                  onChange={(event) =>
                    updateField("countryOfOrigin", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section
            number="02"
            title="Product Taxonomy"
            description="Choose the exact category. The selected subcategory determines which specifications appear below."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Department" required>
                <select
                  value={form.departmentId}
                  onChange={(event) =>
                    handleDepartmentChange(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select department</option>

                  {taxonomy.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category" required>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    handleCategoryChange(event.target.value)
                  }
                  disabled={!form.departmentId}
                  className={inputClass}
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subcategory" required>
                <select
                  value={form.subCategoryId}
                  onChange={(event) =>
                    handleSubCategoryChange(event.target.value)
                  }
                  disabled={!form.categoryId}
                  className={inputClass}
                >
                  <option value="">Select subcategory</option>

                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {selectedSubCategory && (
              <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />

                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {selectedSubCategory.name}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      The product specification form has been loaded for this
                      subcategory.
                    </p>

                    {selectedSubCategory.googleProductCategoryPath && (
                      <p className="mt-2 text-xs text-stone-500">
                        Google category:{" "}
                        <span className="font-medium text-stone-700">
                          {selectedSubCategory.googleProductCategoryPath}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section
            number="03"
            title="Description"
            description="Write useful, specific product content. Avoid keyword stuffing."
          >
            <div className="space-y-5">
              <Field label="Short Description" required>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={4}
                  placeholder="A concise description of the product..."
                  className={textareaClass}
                />
              </Field>

              <Field label="Long Description">
                <textarea
                  value={form.longDescription}
                  onChange={(event) =>
                    updateField("longDescription", event.target.value)
                  }
                  rows={8}
                  placeholder="Detailed product description..."
                  className={textareaClass}
                />
              </Field>

              <Field label="Editorial Highlight">
                <textarea
                  value={form.editorialHighlight}
                  onChange={(event) =>
                    updateField("editorialHighlight", event.target.value)
                  }
                  rows={3}
                  placeholder="The design story, inspiration or standout feature..."
                  className={textareaClass}
                />
              </Field>
            </div>
          </Section>

          <Section
            number="04"
            title="Pricing & Availability"
            description="Commercial information shown to customers."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Price" required>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  placeholder="0"
                  className={inputClass}
                />
              </Field>

              <Field label="Original Price">
                <input
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(event) =>
                    updateField("originalPrice", event.target.value)
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="UGX">UGX — Ugandan Shilling</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </Field>

              <Field label="Availability" required>
                <select
                  value={form.availability}
                  onChange={(event) => {
                    const value = event.target.value

                    updateField("availability", value)
                    updateField(
                      "inStock",
                      value === "in_stock" ||
                        value === "available_on_request",
                    )
                  }}
                  className={inputClass}
                >
                  <option value="in_stock">In Stock</option>
                  <option value="made_to_order">Made to Order</option>
                  <option value="pre_order">Pre-Order</option>
                  <option value="available_on_request">
                    Available on Request
                  </option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </Field>

              <Field label="Quantity">
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) =>
                    updateField("quantity", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Lead Time">
                <input
                  value={form.leadTime}
                  onChange={(event) =>
                    updateField("leadTime", event.target.value)
                  }
                  placeholder="e.g. 6–8 weeks"
                  className={inputClass}
                />
              </Field>

              <Field label="Weight">
                <input
                  type="number"
                  min="0"
                  value={form.weight}
                  onChange={(event) =>
                    updateField("weight", event.target.value)
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>

              <Field label="Weight Unit">
                <select
                  value={form.weightUnit}
                  onChange={(event) =>
                    updateField("weightUnit", event.target.value)
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
              number="05"
              title="Product Specifications"
              description={`Specifications for ${selectedSubCategory?.name ?? "this product"}. These fields are controlled by the selected subcategory template.`}
            >
              <DynamicAttributes
                schema={templateSchema}
                values={form.attributes}
                onChange={updateAttribute}
              />
            </Section>
          )}

          {form.subCategoryId && !templateSchema && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-900">
                No specification template is configured for this subcategory.
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                The product can still be saved as a draft, but configure an
                attribute template before publishing it.
              </p>
            </section>
          )}

          <Section
            number="06"
            title="Google Merchant"
            description="Google data connected to the selected taxonomy."
          >
            <div className="space-y-5">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-stone-400">
                  Google Product Category
                </p>

                <p className="mt-2 text-sm text-stone-800">
                  {form.googleProductCategoryPath ||
                    "No Google category assigned"}
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  This is inherited from the selected subcategory. Only
                  override it when the product genuinely belongs to another
                  Google category.
                </p>
              </div>

              <Field label="Google Category Override">
                <input
                  value={form.googleProductCategoryPath}
                  onChange={(event) =>
                    updateField(
                      "googleProductCategoryPath",
                      event.target.value,
                    )
                  }
                  placeholder="Optional Google category path"
                  className={inputClass}
                />
              </Field>

              <Field label="Canonical URL">
                <input
                  value={form.canonicalUrl}
                  onChange={(event) =>
                    updateField("canonicalUrl", event.target.value)
                  }
                  placeholder="https://therevampug.com/products/..."
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg border border-stone-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(event) =>
                      updateField("isNewArrival", event.target.checked)
                    }
                    className="mt-0.5"
                  />

                  <span>
                    <span className="block text-sm font-medium text-stone-900">
                      New Arrival
                    </span>
                    <span className="mt-1 block text-xs text-stone-500">
                      Mark this product as a new catalogue arrival.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-stone-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={(event) =>
                      updateField("isBestSeller", event.target.checked)
                    }
                    className="mt-0.5"
                  />

                  <span>
                    <span className="block text-sm font-medium text-stone-900">
                      Best Seller
                    </span>
                    <span className="mt-1 block text-xs text-stone-500">
                      Highlight this product as a best seller.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-stone-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                    className="mt-0.5"
                  />

                  <span>
                    <span className="block text-sm font-medium text-stone-900">
                      Featured
                    </span>
                    <span className="mt-1 block text-xs text-stone-500">
                      Feature this product across the storefront.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-stone-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.isOnSale}
                    onChange={(event) =>
                      updateField("isOnSale", event.target.checked)
                    }
                    className="mt-0.5"
                  />

                  <span>
                    <span className="block text-sm font-medium text-stone-900">
                      On Sale
                    </span>
                    <span className="mt-1 block text-xs text-stone-500">
                      Mark this product as currently discounted.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </Section>

          <Section
            number="07"
            title="SEO"
            description="Search-engine metadata for the product page."
          >
            <div className="space-y-5">
              <Field label="SEO Title">
                <input
                  value={form.seoTitle}
                  onChange={(event) =>
                    updateField("seoTitle", event.target.value)
                  }
                  maxLength={70}
                  placeholder={form.name || "Product SEO title"}
                  className={inputClass}
                />
              </Field>

              <Field label="SEO Description">
                <textarea
                  value={form.seoDescription}
                  onChange={(event) =>
                    updateField("seoDescription", event.target.value)
                  }
                  maxLength={160}
                  rows={4}
                  placeholder="A concise search-friendly description..."
                  className={textareaClass}
                />
              </Field>
            </div>
          </Section>
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveProduct("draft")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveProduct("ready_for_review")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-5 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ready for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-5 py-5 sm:px-6">
        <div className="flex gap-4">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-stone-400">
            {number}
          </span>

          <div>
            <h2 className="text-base font-semibold text-stone-950">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
})
