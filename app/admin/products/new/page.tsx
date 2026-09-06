"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { CldUploadWidget } from '@/components/admin/cloudflare-upload-widget'

type Department = {
  id: string
  name: string
  slug: string
}

type Category = {
  id: string
  name: string
  slug: string
  departmentId: string
}

type LibraryItem = {
  id: string
  name: string
  slug: string
  description?: string | null
  hex?: string | null
  family?: string | null
  baseType?: string | null
  composition?: string | null
  code?: string | null
  swatchImage?: string | null
}

type Field = {
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
  description?: string
  placeholder?: string
  unit?: string
  min?: number
  max?: number
  step?: number
  options?: {
    label: string
    value: string
  }[]
  library?:
    | "color_library"
    | "material_library"
    | "fabric_library"
    | "finish_library"
}

type TemplateSchema = {
  version?: number
  fields?: Field[]
  groups?: {
    key: string
    label: string
    description?: string
    fields: Field[]
  }[]
}

type SubCategory = {
  id: string
  name: string
  slug: string
  categoryId: string
  templateId: string | null
  googleProductCategoryId: string | null
  googleProductCategoryPath: string | null
  templateSchema: TemplateSchema | null
}

type TaxonomyResponse = {
  success: boolean
  departments: Department[]
  categories: Category[]
  subCategories: SubCategory[]
}

type FormState = {
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
  tags: string

  price: string
  originalPrice: string
  currency: string

  condition: string
  availability: string
  quantity: string
  inStock: boolean
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
}

const initialForm: FormState = {
  name: "",
  slug: "",
  sku: "",
  mpn: "",
  gtin: "",
  brand: "The Revamp UG",
  manufacturer: "",
  countryOfOrigin: "",

  departmentId: "",
  categoryId: "",
  subCategoryId: "",

  productType: "standard",

  description: "",
  longDescription: "",
  editorialHighlight: "",
  tags: "",

  price: "",
  originalPrice: "",
  currency: "UGX",

  condition: "new",
  availability: "in_stock",
  quantity: "0",
  inStock: true,
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
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function NewProductPage() {
  const router = useRouter()

  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null)
  const [libraries, setLibraries] = useState<{
    colors: LibraryItem[]
    materials: LibraryItem[]
    fabrics: LibraryItem[]
    finishes: LibraryItem[]
  }>({
    colors: [],
    materials: [],
    fabrics: [],
    finishes: [],
  })

  const [form, setForm] = useState<FormState>(initialForm)
  const [attributes, setAttributes] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [taxonomyResponse, librariesResponse] = await Promise.all([
          fetch("/api/admin/product-taxonomy", { cache: "no-store" }),
          fetch("/api/admin/product-libraries", { cache: "no-store" }),
        ])

        const taxonomyData = await taxonomyResponse.json()
        const librariesData = await librariesResponse.json()

        if (!taxonomyResponse.ok || !taxonomyData.success) {
          throw new Error("Unable to load product taxonomy.")
        }

        if (!librariesResponse.ok || !librariesData.success) {
          throw new Error("Unable to load product libraries.")
        }

        setTaxonomy(taxonomyData)
        setLibraries({
          colors: librariesData.colors ?? [],
          materials: librariesData.materials ?? [],
          fabrics: librariesData.fabrics ?? [],
          finishes: librariesData.finishes ?? [],
        })
      } catch (err) {
        console.error(err)
        setError("Unable to load product configuration. Please refresh.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const categories = useMemo(() => {
    if (!taxonomy || !form.departmentId) return []
    return taxonomy.categories.filter(
      (category) => category.departmentId === form.departmentId
    )
  }, [taxonomy, form.departmentId])

  const subCategories = useMemo(() => {
    if (!taxonomy || !form.categoryId) return []
    return taxonomy.subCategories.filter(
      (subCategory) => subCategory.categoryId === form.categoryId
    )
  }, [taxonomy, form.categoryId])

  const selectedSubCategory = useMemo(() => {
    if (!taxonomy || !form.subCategoryId) return null
    return (
      taxonomy.subCategories.find(
        (item) => item.id === form.subCategoryId
      ) ?? null
    )
  }, [taxonomy, form.subCategoryId])

  const templateFields = useMemo(() => {
    const schema = selectedSubCategory?.templateSchema
    if (!schema) return []

    if (schema.groups && schema.groups.length) {
      return schema.groups.flatMap((group) => group.fields)
    }

    return schema.fields ?? []
  }, [selectedSubCategory])

  function updateField(key: keyof FormState, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
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
    }))
    setAttributes({})
  }

  function handleCategoryChange(value: string) {
    setForm((current) => ({
      ...current,
      categoryId: value,
      subCategoryId: "",
      googleProductCategoryId: "",
      googleProductCategoryPath: "",
    }))
    setAttributes({})
  }

  function handleSubCategoryChange(value: string) {
    const subCategory = taxonomy?.subCategories.find(
      (item) => item.id === value
    )

    setForm((current) => ({
      ...current,
      subCategoryId: value,
      googleProductCategoryId: subCategory?.googleProductCategoryId ?? "",
      googleProductCategoryPath: subCategory?.googleProductCategoryPath ?? "",
    }))
    setAttributes({})
  }

  function updateAttribute(key: string, value: unknown) {
    setAttributes((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function renderAttributeField(field: Field) {
    const value = attributes[field.key]
    const commonClass =
      "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"

    if (field.type === "boolean") {
      return (
        <label
          key={field.key}
          className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3"
        >
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              updateAttribute(field.key, event.target.checked)
            }
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">{field.label}</span>
        </label>
      )
    }

    if (field.type === "select") {
      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(event) =>
              updateAttribute(field.key, event.target.value)
            }
            className={commonClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="text-xs text-neutral-500">{field.description}</p>
          )}
        </div>
      )
    }

    if (field.type === "multiselect") {
      const selected = Array.isArray(value) ? value : []
      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium">{field.label}</label>
          <select
            multiple
            value={selected as string[]}
            onChange={(event) => {
              const values = Array.from(event.target.selectedOptions).map(
                (option) => option.value
              )
              updateAttribute(field.key, values)
            }}
            className={`${commonClass} min-h-28`}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <textarea
            rows={4}
            value={typeof value === "string" ? value : ""}
            onChange={(event) =>
              updateAttribute(field.key, event.target.value)
            }
            placeholder={field.placeholder}
            className={commonClass}
          />
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

      const items = libraries[libraryKey]
      const customValue =
        value && typeof value === "object"
          ? String((value as { value?: unknown }).value ?? "")
          : ""
      const customSwatchImage =
        value && typeof value === "object"
          ? String((value as { swatchImage?: unknown }).swatchImage ?? "")
          : ""
      const selectedLibraryId = typeof value === "string" ? value : ""
      const selectedLibraryItem = items.find((item) => item.id === selectedLibraryId)

      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <select
            value={selectedLibraryId || (customValue ? "__custom__" : "")}
            onChange={(event) => {
              if (event.target.value === "__custom__") {
                updateAttribute(field.key, { value: customValue, swatchImage: customSwatchImage })
              } else {
                updateAttribute(field.key, event.target.value)
              }
            }}
            className={commonClass}
          >
            <option value="">Select {field.label}</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.code ? ` (${item.code})` : ""}
              </option>
            ))}
            <option value="__custom__">Add a custom {field.label.toLowerCase()}</option>
          </select>
          {selectedLibraryItem?.swatchImage && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <img src={selectedLibraryItem.swatchImage} alt="" className="h-8 w-8 rounded-full border border-neutral-200 object-cover" />
              Library swatch
            </div>
          )}
          {customValue !== "" || (value && typeof value === "object") ? (
            <div className="space-y-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
              <input
                value={customValue}
                onChange={(event) =>
                  updateAttribute(field.key, { value: event.target.value, swatchImage: customSwatchImage })
                }
                placeholder={`Enter a custom ${field.label.toLowerCase()}`}
                className={commonClass}
              />
              <div className="flex flex-wrap items-center gap-3">
                {customSwatchImage && <img src={customSwatchImage} alt="" className="h-10 w-10 rounded-full border border-neutral-200 object-cover" />}
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "revamp_preset"}
                  onSuccess={(result: any) => {
                    const url = result?.info?.secure_url
                    if (url) updateAttribute(field.key, { value: customValue, swatchImage: url })
                  }}
                >
                  {({ open }) => (
                    <button type="button" onClick={() => open()} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs hover:bg-neutral-100">
                      {customSwatchImage ? "Replace swatch image" : "Upload swatch image"}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
            </div>
          ) : null}
          {field.description && (
            <p className="text-xs text-neutral-500">{field.description}</p>
          )}
        </div>
      )
    }

    const isNumber = field.type === "number"

    return (
      <div key={field.key} className="space-y-2">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            type={isNumber ? "number" : "text"}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(event) => {
              const nextValue = isNumber
                ? event.target.value === ""
                  ? ""
                  : Number(event.target.value)
                : event.target.value

              updateAttribute(field.key, nextValue)
            }}
            min={field.min}
            max={field.max}
            step={field.step}
            placeholder={field.placeholder}
            className={`${commonClass} ${field.unit ? "pr-16" : ""}`}
          />
          {field.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
              {field.unit}
            </span>
          )}
        </div>
        {field.description && (
          <p className="text-xs text-neutral-500">{field.description}</p>
        )}
      </div>
    )
  }

  async function handleSubmit(status: "draft" | "ready_for_review") {
    setError("")
    setSuccess("")

    if (!form.name.trim()) {
      setError("Product name is required.")
      return
    }

    if (!form.sku.trim()) {
      setError("SKU is required.")
      return
    }

    if (!form.departmentId) {
      setError("Select a department.")
      return
    }

    if (!form.categoryId) {
      setError("Select a category.")
      return
    }

    if (!form.subCategoryId) {
      setError("Select a subcategory.")
      return
    }

    if (!form.price) {
      setError("Product price is required.")
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          quantity: Number(form.quantity || 0),
          weight: form.weight ? Number(form.weight) : null,
          status,
          attributes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product.")
      }

      setSuccess(
        status === "draft"
          ? "Product saved as draft. Redirecting so you can add images and variants…"
          : "Product submitted for review. Redirecting so you can add images and variants…"
      )

      if (data.product?.id) {
        router.push(`/admin/products/${data.product.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-neutral-500">
          Loading product system...
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3]">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Catalogue
          </p>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-medium tracking-tight">
                Add Product
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-500">
                Create a product using the Revamp catalogue structure and
                category-specific specifications.
              </p>
            </div>

            <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">
              Google-ready catalogue
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                01
              </p>
              <h2 className="mt-1 text-lg font-medium">Product Identity</h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Product Name *</label>
                <input
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Luna Bouclé Sofa"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SKU *</label>
                <input
                  value={form.sku}
                  onChange={(event) =>
                    updateField("sku", event.target.value.toUpperCase())
                  }
                  placeholder="REV-SOF-LUNA-001"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    updateField("slug", slugify(event.target.value))
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <input
                  value={form.brand}
                  onChange={(event) => updateField("brand", event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturer</label>
                <input
                  value={form.manufacturer}
                  onChange={(event) =>
                    updateField("manufacturer", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">MPN</label>
                <input
                  value={form.mpn}
                  onChange={(event) => updateField("mpn", event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GTIN</label>
                <input
                  value={form.gtin}
                  onChange={(event) => updateField("gtin", event.target.value)}
                  placeholder="If manufacturer assigned"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                02
              </p>
              <h2 className="mt-1 text-lg font-medium">
                Catalogue Classification
              </h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department *</label>
                <select
                  value={form.departmentId}
                  onChange={(event) =>
                    handleDepartmentChange(event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Select department</option>
                  {taxonomy?.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    handleCategoryChange(event.target.value)
                  }
                  disabled={!form.departmentId}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm disabled:bg-neutral-100"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategory *</label>
                <select
                  value={form.subCategoryId}
                  onChange={(event) =>
                    handleSubCategoryChange(event.target.value)
                  }
                  disabled={!form.categoryId}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm disabled:bg-neutral-100"
                >
                  <option value="">Select subcategory</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubCategory && (
                <div className="md:col-span-3">
                  <div className="rounded-lg bg-neutral-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400">
                          Product Template
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {selectedSubCategory.templateSchema
                            ? "Category-specific specification form loaded"
                            : "No specification template assigned"}
                        </p>
                      </div>

                      {selectedSubCategory.googleProductCategoryId && (
                        <div className="text-xs text-neutral-500">
                          Google category:{" "}
                          {selectedSubCategory.googleProductCategoryId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                03
              </p>
              <h2 className="mt-1 text-lg font-medium">Product Details</h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Short Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Long Description</label>
                <textarea
                  rows={7}
                  value={form.longDescription}
                  onChange={(event) =>
                    updateField("longDescription", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Editorial Highlight
                </label>
                <textarea
                  rows={3}
                  value={form.editorialHighlight}
                  onChange={(event) =>
                    updateField("editorialHighlight", event.target.value)
                  }
                  placeholder="A concise luxury/editorial statement about the piece."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Product Tags</label>
                <input
                  value={form.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  placeholder="handmade, oak, living room, Ugandan design"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
                <p className="text-xs text-neutral-500">Comma-separated terms used for SEO, site search, and product feeds.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Type</label>
                <select
                  value={form.productType}
                  onChange={(event) =>
                    updateField("productType", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="made_to_order">Made to Order</option>
                  <option value="custom_bespoke">Custom / Bespoke</option>
                  <option value="sourced_on_request">Sourced on Request</option>
                  <option value="pre_order">Pre-order</option>
                  <option value="set">Set</option>
                  <option value="bundle">Bundle</option>
                  <option value="sample">Sample</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Country of Origin</label>
                <input
                  value={form.countryOfOrigin}
                  onChange={(event) =>
                    updateField("countryOfOrigin", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          {selectedSubCategory && templateFields.length > 0 && (
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  04
                </p>
                <h2 className="mt-1 text-lg font-medium">Specifications</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  These fields are determined by the selected product category.
                </p>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                {templateFields.map((field) => renderAttributeField(field))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                05
              </p>
              <h2 className="mt-1 text-lg font-medium">Pricing & Inventory</h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selling Price *</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Original Price</label>
                <input
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(event) =>
                    updateField("originalPrice", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <select
                  value={form.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="UGX">UGX</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Availability</label>
                <select
                  value={form.availability}
                  onChange={(event) =>
                    updateField("availability", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="made_to_order">Made to Order</option>
                  <option value="pre_order">Pre-order</option>
                  <option value="available_on_request">
                    Available on Request
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) =>
                    updateField("quantity", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Time</label>
                <input
                  value={form.leadTime}
                  onChange={(event) =>
                    updateField("leadTime", event.target.value)
                  }
                  placeholder="e.g. 8–12 weeks"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <label className="flex items-center gap-3 md:col-span-3">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(event) =>
                    updateField("inStock", event.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Product is currently in stock</span>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                06
              </p>
              <h2 className="mt-1 text-lg font-medium">Physical Information</h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight</label>
                <input
                  type="number"
                  min="0"
                  value={form.weight}
                  onChange={(event) =>
                    updateField("weight", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Weight Unit</label>
                <select
                  value={form.weightUnit}
                  onChange={(event) =>
                    updateField("weightUnit", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="kg">Kilograms</option>
                  <option value="g">Grams</option>
                  <option value="lb">Pounds</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                07
              </p>
              <h2 className="mt-1 text-lg font-medium">Google Merchant</h2>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Google Product Category ID
                </label>
                <input
                  value={form.googleProductCategoryId}
                  onChange={(event) =>
                    updateField("googleProductCategoryId", event.target.value)
                  }
                  placeholder="Inherited from subcategory when available"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Google Product Category Path
                </label>
                <input
                  value={form.googleProductCategoryPath}
                  onChange={(event) =>
                    updateField("googleProductCategoryPath", event.target.value)
                  }
                  placeholder="Home & Garden > Furniture > ..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600 md:col-span-2">
                Google synchronization will happen after the product has the
                required information, images and storefront URL. Creating the
                product here does not automatically publish it to Google.
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                08
              </p>
              <h2 className="mt-1 text-lg font-medium">SEO</h2>
            </div>

            <div className="grid gap-5 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Canonical URL</label>
                <input
                  value={form.canonicalUrl}
                  onChange={(event) =>
                    updateField("canonicalUrl", event.target.value)
                  }
                  placeholder="https://therevampug.com/collections/..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SEO Title</label>
                <input
                  value={form.seoTitle}
                  onChange={(event) =>
                    updateField("seoTitle", event.target.value)
                  }
                  maxLength={255}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SEO Description</label>
                <textarea
                  rows={4}
                  value={form.seoDescription}
                  onChange={(event) =>
                    updateField("seoDescription", event.target.value)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                09
              </p>
              <h2 className="mt-1 text-lg font-medium">Merchandising</h2>
            </div>

            <div className="grid gap-3 p-6 md:grid-cols-2">
              {[
                ["featured", "Featured Product"],
                ["isNewArrival", "New Arrival"],
                ["isBestSeller", "Best Seller"],
                ["isOnSale", "On Sale"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof FormState])}
                    onChange={(event) =>
                      updateField(
                        key as keyof FormState,
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="sticky bottom-4 z-20 rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium">Ready to save?</p>
                <p className="text-xs text-neutral-500">
                  Products can be reviewed before publishing to the storefront
                  or Google.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmit("draft")}
                  className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmit("ready_for_review")}
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {saving ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}



// "use client"

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react"
// import { useRouter } from "next/navigation"

// type Department = {
//   id: string
//   name: string
//   slug: string
// }

// type Category = {
//   id: string
//   name: string
//   slug: string
//   departmentId: string
// }

// type LibraryItem = {
//   id: string
//   name: string
//   slug: string
//   description ? : string | null
//   hex ? : string | null
//   family ? : string | null
//   baseType ? : string | null
//   composition ? : string | null
//   code ? : string | null
//   swatchImage ? : string | null
// }

// type Field = {
//   key: string
//   label: string
//   type:
//     | "text"
//     | "textarea"
//     | "number"
//     | "measurement"
//     | "select"
//     | "multiselect"
//     | "boolean"
//     | "color"
//     | "fabric"
//     | "material"
//     | "finish"
//   required?: boolean
//   description?: string
//   placeholder?: string
//   unit?: string
//   min?: number
//   max?: number
//   step?: number
//   options?: {
//     label: string
//     value: string
//   }[]
//   library?:
//     | "color_library"
//     | "material_library"
//     | "fabric_library"
//     | "finish_library"
// }

// type TemplateSchema = {
//   version?: number
//   fields?: Field[]
//   groups?: {
//     key: string
//     label: string
//     description?: string
//     fields: Field[]
//   }[]
// }

// type SubCategory = {
//   id: string
//   name: string
//   slug: string
//   categoryId: string
//   templateId: string | null
//   googleProductCategoryId: string | null
//   googleProductCategoryPath: string | null
//   templateSchema: TemplateSchema | null
// }

// type TaxonomyResponse = {
//   success: boolean
//   departments: Department[]
//   categories: Category[]
//   subCategories: SubCategory[]
// }

// type FormState = {
//   name: string
//   slug: string
//   sku: string
//   mpn: string
//   gtin: string
//   brand: string
//   manufacturer: string
//   countryOfOrigin: string

//   departmentId: string
//   categoryId: string
//   subCategoryId: string

//   productType: string

//   description: string
//   longDescription: string
//   editorialHighlight: string

//   price: string
//   originalPrice: string
//   currency: string

//   condition: string
//   availability: string
//   quantity: string
//   inStock: boolean
//   leadTime: string

//   weight: string
//   weightUnit: string

//   googleProductCategoryId: string
//   googleProductCategoryPath: string

//   canonicalUrl: string
//   seoTitle: string
//   seoDescription: string

//   featured: boolean
//   isNewArrival: boolean
//   isBestSeller: boolean
//   isOnSale: boolean
// }

// const [libraries, setLibraries] =
// useState < {
//   colors: LibraryItem[]
//   materials: LibraryItem[]
//   fabrics: LibraryItem[]
//   finishes: LibraryItem[]
// } > ({
//   colors: [],
//   materials: [],
//   fabrics: [],
//   finishes: [],
// })

// const initialForm: FormState = {
//   name: "",
//   slug: "",
//   sku: "",
//   mpn: "",
//   gtin: "",
//   brand: "The Revamp UG",
//   manufacturer: "",
//   countryOfOrigin: "",

//   departmentId: "",
//   categoryId: "",
//   subCategoryId: "",

//   productType: "standard",

//   description: "",
//   longDescription: "",
//   editorialHighlight: "",

//   price: "",
//   originalPrice: "",
//   currency: "UGX",

//   condition: "new",
//   availability: "in_stock",
//   quantity: "0",
//   inStock: true,
//   leadTime: "",

//   weight: "",
//   weightUnit: "kg",

//   googleProductCategoryId: "",
//   googleProductCategoryPath: "",

//   canonicalUrl: "",
//   seoTitle: "",
//   seoDescription: "",

//   featured: false,
//   isNewArrival: false,
//   isBestSeller: false,
//   isOnSale: false,
// }

// function slugify(value: string) {
//   return value
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "")
// }

// export default function NewProductPage() {
//   const router = useRouter()

//   const [taxonomy, setTaxonomy] =
//     useState<TaxonomyResponse | null>(null)

//   const [form, setForm] =
//     useState<FormState>(initialForm)

//   const [attributes, setAttributes] =
//     useState<Record<string, unknown>>({})

//   const [loading, setLoading] =
//     useState(true)

//   const [saving, setSaving] =
//     useState(false)

//   const [error, setError] =
//     useState("")

//   const [success, setSuccess] =
//     useState("")

//   useEffect(() => {
//     async function loadTaxonomy() {
//       try {
//         const response = await fetch(
//           "/api/admin/product-taxonomy",
//           {
//             cache: "no-store",
//           },
//         )

//         const data =
//           (await response.json()) as TaxonomyResponse

//         if (!response.ok || !data.success) {
//           throw new Error(
//             "Unable to load product taxonomy.",
//           )
//         }

//         setTaxonomy(data)
//       } catch (err) {
//         console.error(err)

//         setError(
//           "Unable to load product categories. Please refresh the page.",
//         )
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadTaxonomy()
//   }, []
    
//     (() => {
//   async function loadData() {
//     try {
//       const [
//         taxonomyResponse,
//         librariesResponse,
//       ] = await Promise.all([
//         fetch(
//           "/api/admin/product-taxonomy",
//           {
//             cache: "no-store",
//           },
//         ),
//         fetch(
//           "/api/admin/product-libraries",
//           {
//             cache: "no-store",
//           },
//         ),
//       ])

//       const taxonomyData =
//         await taxonomyResponse.json()

//       const librariesData =
//         await librariesResponse.json()

//       if (
//         !taxonomyResponse.ok ||
//         !taxonomyData.success
//       ) {
//         throw new Error(
//           "Unable to load product taxonomy.",
//         )
//       }

//       if (
//         !librariesResponse.ok ||
//         !librariesData.success
//       ) {
//         throw new Error(
//           "Unable to load product libraries.",
//         )
//       }

//       setTaxonomy(
//         taxonomyData,
//       )

//       setLibraries({
//         colors:
//           librariesData.colors ??
//           [],
//         materials:
//           librariesData.materials ??
//           [],
//         fabrics:
//           librariesData.fabrics ??
//           [],
//         finishes:
//           librariesData.finishes ??
//           [],
//       })
//     } catch (error) {
//       console.error(error)

//       setError(
//         "Unable to load the product configuration.",
//       )
//     } finally {
//       setLoading(false)
//     }
//   }

//   loadData()
// }, [])
//   )

//   const categories = useMemo(() => {
//     if (!taxonomy || !form.departmentId) {
//       return []
//     }

//     return taxonomy.categories.filter(
//       (category) =>
//         category.departmentId ===
//         form.departmentId,
//     )
//   }, [
//     taxonomy,
//     form.departmentId,
//   ])

//   const subCategories = useMemo(() => {
//     if (!taxonomy || !form.categoryId) {
//       return []
//     }

//     return taxonomy.subCategories.filter(
//       (subCategory) =>
//         subCategory.categoryId ===
//         form.categoryId,
//     )
//   }, [
//     taxonomy,
//     form.categoryId,
//   ])

//   const selectedSubCategory =
//     useMemo(() => {
//       if (!taxonomy || !form.subCategoryId) {
//         return null
//       }

//       return (
//         taxonomy.subCategories.find(
//           (item) =>
//             item.id ===
//             form.subCategoryId,
//         ) ?? null
//       )
//     }, [
//       taxonomy,
//       form.subCategoryId,
//     ])

//   const templateFields = useMemo(() => {
//     const schema =
//       selectedSubCategory?.templateSchema

//     if (!schema) {
//       return []
//     }

//     if (
//       schema.groups &&
//       schema.groups.length
//     ) {
//       return schema.groups.flatMap(
//         (group) =>
//           group.fields,
//       )
//     }

//     return schema.fields ?? []
//   }, [selectedSubCategory])

//   function updateField(
//     key: keyof FormState,
//     value: string | boolean,
//   ) {
//     setForm((current) => ({
//       ...current,
//       [key]: value,
//     }))
//   }

//   function handleNameChange(
//     value: string,
//   ) {
//     setForm((current) => ({
//       ...current,
//       name: value,
//       slug:
//         current.slug ===
//           "" ||
//         current.slug ===
//           slugify(current.name)
//           ? slugify(value)
//           : current.slug,
//     }))
//   }

//   function handleDepartmentChange(
//     value: string,
//   ) {
//     setForm((current) => ({
//       ...current,
//       departmentId: value,
//       categoryId: "",
//       subCategoryId: "",
//       googleProductCategoryId: "",
//       googleProductCategoryPath: "",
//     }))

//     setAttributes({})
//   }

//   function handleCategoryChange(
//     value: string,
//   ) {
//     setForm((current) => ({
//       ...current,
//       categoryId: value,
//       subCategoryId: "",
//       googleProductCategoryId: "",
//       googleProductCategoryPath: "",
//     }))

//     setAttributes({})
//   }

//   function handleSubCategoryChange(
//     value: string,
//   ) {
//     const subCategory =
//       taxonomy?.subCategories.find(
//         (item) =>
//           item.id === value,
//       )

//     setForm((current) => ({
//       ...current,
//       subCategoryId: value,
//       googleProductCategoryId:
//         subCategory
//           ?.googleProductCategoryId ??
//         "",
//       googleProductCategoryPath:
//         subCategory
//           ?.googleProductCategoryPath ??
//         "",
//     }))

//     setAttributes({})
//   }

//   function updateAttribute(
//     key: string,
//     value: unknown,
//   ) {
//     setAttributes((current) => ({
//       ...current,
//       [key]: value,
//     }))
//   }

//   function renderAttributeField(
//     field: Field,
//   ) {
//     const value =
//       attributes[field.key]

//     const commonClass =
//       "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"

//     if (
//       field.type === "boolean"
//     ) {
//       return (
//         <label
//           key={field.key}
//           className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3"
//         >
//           <input
//             type="checkbox"
//             checked={
//               Boolean(value)
//             }
//             onChange={(event) =>
//               updateAttribute(
//                 field.key,
//                 event.target.checked,
//               )
//             }
//             className="h-4 w-4"
//           />

//           <span className="text-sm font-medium">
//             {field.label}
//           </span>
//         </label>
//       )
//     }

//     if (
//       field.type ===
//         "select"
//     ) {
//       return (
//         <div
//           key={field.key}
//           className="space-y-2"
//         >
//           <label className="text-sm font-medium">
//             {field.label}
//             {field.required && (
//               <span className="ml-1 text-red-500">
//                 *
//               </span>
//             )}
//           </label>

//           <select
//             value={
//               typeof value ===
//               "string"
//                 ? value
//                 : ""
//             }
//             onChange={(event) =>
//               updateAttribute(
//                 field.key,
//                 event.target.value,
//               )
//             }
//             className={commonClass}
//           >
//             <option value="">
//               Select {field.label}
//             </option>

//             {field.options?.map(
//               (option) => (
//                 <option
//                   key={
//                     option.value
//                   }
//                   value={
//                     option.value
//                   }
//                 >
//                   {option.label}
//                 </option>
//               ),
//             )}
//           </select>

//           {field.description && (
//             <p className="text-xs text-neutral-500">
//               {field.description}
//             </p>
//           )}
//         </div>
//       )
//     }

//     if (
//       field.type ===
//         "multiselect"
//     ) {
//       const selected =
//         Array.isArray(value)
//           ? value
//           : []

//       return (
//         <div
//           key={field.key}
//           className="space-y-2"
//         >
//           <label className="text-sm font-medium">
//             {field.label}
//           </label>

//           <select
//             multiple
//             value={
//               selected as string[]
//             }
//             onChange={(event) => {
//               const values =
//                 Array.from(
//                   event.target
//                     .selectedOptions,
//                 ).map(
//                   (option) =>
//                     option.value,
//                 )

//               updateAttribute(
//                 field.key,
//                 values,
//               )
//             }}
//             className={`${commonClass} min-h-28`}
//           >
//             {field.options?.map(
//               (option) => (
//                 <option
//                   key={
//                     option.value
//                   }
//                   value={
//                     option.value
//                   }
//                 >
//                   {option.label}
//                 </option>
//               ),
//             )}
//           </select>
//         </div>
//       )
//     }

//     if (
//       field.type ===
//       "textarea"
//     ) {
//       return (
//         <div
//           key={field.key}
//           className="space-y-2 md:col-span-2"
//         >
//           <label className="text-sm font-medium">
//             {field.label}
//             {field.required && (
//               <span className="ml-1 text-red-500">
//                 *
//               </span>
//             )}
//           </label>

//           <textarea
//             rows={4}
//             value={
//               typeof value ===
//               "string"
//                 ? value
//                 : ""
//             }
//             onChange={(event) =>
//               updateAttribute(
//                 field.key,
//                 event.target.value,
//               )
//             }
//             placeholder={
//               field.placeholder
//             }
//             className={commonClass}
//           />
//         </div>
//       )
//     }

//     if (
//   field.type === "material" ||
//   field.type === "fabric" ||
//   field.type === "finish" ||
//   field.type === "color"
// ) {
//   const libraryKey =
//     field.type === "material" ?
//     "materials" :
//     field.type === "fabric" ?
//     "fabrics" :
//     field.type === "finish" ?
//     "finishes" :
//     "colors"
  
//   const items =
//     libraries[libraryKey]
  
//   return (
//     <div
//       key={field.key}
//       className="space-y-2"
//     >
//       <label className="text-sm font-medium">
//         {field.label}

//         {field.required && (
//           <span className="ml-1 text-red-500">
//             *
//           </span>
//         )}
//       </label>

//       <select
//         value={
//           typeof value === "string"
//             ? value
//             : ""
//         }
//         onChange={(event) =>
//           updateAttribute(
//             field.key,
//             event.target.value,
//           )
//         }
//         className={commonClass}
//       >
//         <option value="">
//           Select {field.label}
//         </option>

//         {items.map((item) => (
//           <option
//             key={item.id}
//             value={item.id}
//           >
//             {item.name}
//             {item.code
//               ? ` (${item.code})`
//               : ""}
//           </option>
//         ))}
//       </select>

//       {field.description && (
//         <p className="text-xs text-neutral-500">
//           {field.description}
//         </p>
//       )}
//     </div>
//   )
// }

//     const isNumber =
//       field.type ===
//       "number"

//     return (
//       <div
//         key={field.key}
//         className="space-y-2"
//       >
//         <label className="text-sm font-medium">
//           {field.label}
//           {field.required && (
//             <span className="ml-1 text-red-500">
//               *
//             </span>
//           )}
//         </label>

//         <div className="relative">
//           <input
//             type={
//               isNumber
//                 ? "number"
//                 : "text"
//             }
//             value={
//               value ===
//                 undefined ||
//               value === null
//                 ? ""
//                 : String(value)
//             }
//             onChange={(event) => {
//               const nextValue =
//                 isNumber
//                   ? event.target
//                       .value ===
//                     ""
//                     ? ""
//                     : Number(
//                         event.target
//                           .value,
//                       )
//                   : event.target
//                       .value

//               updateAttribute(
//                 field.key,
//                 nextValue,
//               )
//             }}
//             min={field.min}
//             max={field.max}
//             step={field.step}
//             placeholder={
//               field.placeholder
//             }
//             className={`${commonClass} ${
//               field.unit
//                 ? "pr-16"
//                 : ""
//             }`}
//           />

//           {field.unit && (
//             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
//               {field.unit}
//             </span>
//           )}
//         </div>

//         {field.description && (
//           <p className="text-xs text-neutral-500">
//             {field.description}
//           </p>
//         )}
//       </div>
//     )
//   }

//   async function handleSubmit(
//     status:
//       | "draft"
//       | "ready_for_review",
//   ) {
//     setError("")
//     setSuccess("")

//     if (!form.name.trim()) {
//       setError(
//         "Product name is required.",
//       )
//       return
//     }

//     if (!form.sku.trim()) {
//       setError(
//         "SKU is required.",
//       )
//       return
//     }

//     if (!form.departmentId) {
//       setError(
//         "Select a department.",
//       )
//       return
//     }

//     if (!form.categoryId) {
//       setError(
//         "Select a category.",
//       )
//       return
//     }

//     if (!form.subCategoryId) {
//       setError(
//         "Select a subcategory.",
//       )
//       return
//     }

//     if (!form.price) {
//       setError(
//         "Product price is required.",
//       )
//       return
//     }

//     setSaving(true)

//     try {
//       const response =
//         await fetch(
//           "/api/admin/products",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type":
//                 "application/json",
//             },
//             body: JSON.stringify({
//               ...form,

//               price: Number(
//                 form.price,
//               ),

//               originalPrice:
//                 form.originalPrice
//                   ? Number(
//                       form.originalPrice,
//                     )
//                   : null,

//               quantity: Number(
//                 form.quantity || 0,
//               ),

//               weight:
//                 form.weight
//                   ? Number(
//                       form.weight,
//                     )
//                   : null,

//               status,

//               attributes,
//             }),
//           },
//         )

//       const data =
//         await response.json()

//       if (!response.ok) {
//         throw new Error(
//           data.error ||
//             "Failed to create product.",
//         )
//       }

//       setSuccess(
//         status === "draft"
//           ? "Product saved as draft. Redirecting so you can add images and variants…"
//           : "Product submitted for review. Redirecting so you can add images and variants…",
//       )

//       if (data.product?.id) {
//         router.push(`/admin/products/${data.product.id}`)
//       }
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Something went wrong.",
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex min-h-[70vh] items-center justify-center">
//         <div className="text-sm text-neutral-500">
//           Loading product system...
//         </div>
//       </div>
//     )
//   }

//   return (
//     <main className="min-h-screen bg-[#f7f6f3]">
//       <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
//         <div className="mb-8">
//           <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
//             Catalogue
//           </p>

//           <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
//             <div>
//               <h1 className="text-3xl font-medium tracking-tight">
//                 Add Product
//               </h1>

//               <p className="mt-2 max-w-2xl text-sm text-neutral-500">
//                 Create a product using the Revamp
//                 catalogue structure and category-specific
//                 specifications.
//               </p>
//             </div>

//             <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">
//               Google-ready catalogue
//             </div>
//           </div>
//         </div>

//         {error && (
//           <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
//             {success}
//           </div>
//         )}

//         <div className="space-y-6">
//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 01
//               </p>
//               <h2 className="mt-1 text-lg font-medium">
//                 Product Identity
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6 md:grid-cols-2">
//               <div className="space-y-2 md:col-span-2">
//                 <label className="text-sm font-medium">
//                   Product Name *
//                 </label>

//                 <input
//                   value={form.name}
//                   onChange={(event) =>
//                     handleNameChange(
//                       event.target.value,
//                     )
//                   }
//                   placeholder="e.g. Luna Bouclé Sofa"
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   SKU *
//                 </label>

//                 <input
//                   value={form.sku}
//                   onChange={(event) =>
//                     updateField(
//                       "sku",
//                       event.target.value.toUpperCase(),
//                     )
//                   }
//                   placeholder="REV-SOF-LUNA-001"
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Slug
//                 </label>

//                 <input
//                   value={form.slug}
//                   onChange={(event) =>
//                     updateField(
//                       "slug",
//                       slugify(
//                         event.target.value,
//                       ),
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Brand
//                 </label>

//                 <input
//                   value={form.brand}
//                   onChange={(event) =>
//                     updateField(
//                       "brand",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Manufacturer
//                 </label>

//                 <input
//                   value={form.manufacturer}
//                   onChange={(event) =>
//                     updateField(
//                       "manufacturer",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   MPN
//                 </label>

//                 <input
//                   value={form.mpn}
//                   onChange={(event) =>
//                     updateField(
//                       "mpn",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   GTIN
//                 </label>

//                 <input
//                   value={form.gtin}
//                   onChange={(event) =>
//                     updateField(
//                       "gtin",
//                       event.target.value,
//                     )
//                   }
//                   placeholder="If manufacturer assigned"
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>
//             </div>
//           </section>

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 02
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 Catalogue Classification
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6 md:grid-cols-3">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Department *
//                 </label>

//                 <select
//                   value={
//                     form.departmentId
//                   }
//                   onChange={(event) =>
//                     handleDepartmentChange(
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
//                 >
//                   <option value="">
//                     Select department
//                   </option>

//                   {taxonomy?.departments.map(
//                     (department) => (
//                       <option
//                         key={
//                           department.id
//                         }
//                         value={
//                           department.id
//                         }
//                       >
//                         {
//                           department.name
//                         }
//                       </option>
//                     ),
//                   )}
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Category *
//                 </label>

//                 <select
//                   value={
//                     form.categoryId
//                   }
//                   onChange={(event) =>
//                     handleCategoryChange(
//                       event.target.value,
//                     )
//                   }
//                   disabled={
//                     !form.departmentId
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm disabled:bg-neutral-100"
//                 >
//                   <option value="">
//                     Select category
//                   </option>

//                   {categories.map(
//                     (category) => (
//                       <option
//                         key={
//                           category.id
//                         }
//                         value={
//                           category.id
//                         }
//                       >
//                         {
//                           category.name
//                         }
//                       </option>
//                     ),
//                   )}
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Subcategory *
//                 </label>

//                 <select
//                   value={
//                     form.subCategoryId
//                   }
//                   onChange={(event) =>
//                     handleSubCategoryChange(
//                       event.target.value,
//                     )
//                   }
//                   disabled={
//                     !form.categoryId
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm disabled:bg-neutral-100"
//                 >
//                   <option value="">
//                     Select subcategory
//                   </option>

//                   {subCategories.map(
//                     (subCategory) => (
//                       <option
//                         key={
//                           subCategory.id
//                         }
//                         value={
//                           subCategory.id
//                         }
//                       >
//                         {
//                           subCategory.name
//                         }
//                       </option>
//                     ),
//                   )}
//                 </select>
//               </div>

//               {selectedSubCategory && (
//                 <div className="md:col-span-3">
//                   <div className="rounded-lg bg-neutral-50 p-4">
//                     <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
//                       <div>
//                         <p className="text-xs uppercase tracking-wider text-neutral-400">
//                           Product Template
//                         </p>

//                         <p className="mt-1 text-sm font-medium">
//                           {selectedSubCategory
//                             .templateSchema
//                             ? "Category-specific specification form loaded"
//                             : "No specification template assigned"}
//                         </p>
//                       </div>

//                       {selectedSubCategory.googleProductCategoryId && (
//                         <div className="text-xs text-neutral-500">
//                           Google category:{" "}
//                           {
//                             selectedSubCategory.googleProductCategoryId
//                           }
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </section>

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 03
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 Product Details
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6 md:grid-cols-2">
//               <div className="space-y-2 md:col-span-2">
//                 <label className="text-sm font-medium">
//                   Short Description
//                 </label>

//                 <textarea
//                   rows={3}
//                   value={
//                     form.description
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "description",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2 md:col-span-2">
//                 <label className="text-sm font-medium">
//                   Long Description
//                 </label>

//                 <textarea
//                   rows={7}
//                   value={
//                     form.longDescription
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "longDescription",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2 md:col-span-2">
//                 <label className="text-sm font-medium">
//                   Editorial Highlight
//                 </label>

//                 <textarea
//                   rows={3}
//                   value={
//                     form.editorialHighlight
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "editorialHighlight",
//                       event.target.value,
//                     )
//                   }
//                   placeholder="A concise luxury/editorial statement about the piece."
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Product Type
//                 </label>

//                 <select
//                   value={
//                     form.productType
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "productType",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
//                 >
//                   <option value="standard">
//                     Standard
//                   </option>
//                   <option value="made_to_order">
//                     Made to Order
//                   </option>
//                   <option value="custom_bespoke">
//                     Custom / Bespoke
//                   </option>
//                   <option value="sourced_on_request">
//                     Sourced on Request
//                   </option>
//                   <option value="pre_order">
//                     Pre-order
//                   </option>
//                   <option value="set">
//                     Set
//                   </option>
//                   <option value="bundle">
//                     Bundle
//                   </option>
//                   <option value="sample">
//                     Sample
//                   </option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Country of Origin
//                 </label>

//                 <input
//                   value={
//                     form.countryOfOrigin
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "countryOfOrigin",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-black"
//                 />
//               </div>
//             </div>
//           </section>

//           {selectedSubCategory &&
//             templateFields.length >
//               0 && (
//               <section className="rounded-xl border border-neutral-200 bg-white">
//                 <div className="border-b border-neutral-200 px-6 py-5">
//                   <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                     04
//                   </p>

//                   <h2 className="mt-1 text-lg font-medium">
//                     Specifications
//                   </h2>

//                   <p className="mt-1 text-sm text-neutral-500">
//                     These fields are determined by the selected
//                     product category.
//                   </p>
//                 </div>

//                 <div className="grid gap-5 p-6 md:grid-cols-2">
//                   {templateFields.map(
//                     (field) =>
//                       renderAttributeField(
//                         field,
//                       ),
//                   )}
//                 </div>
//               </section>
//             )}

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 05
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 Pricing & Inventory
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6 md:grid-cols-3">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Selling Price *
//                 </label>

//                 <input
//                   type="number"
//                   min="0"
//                   value={
//                     form.price
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "price",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Original Price
//                 </label>

//                 <input
//                   type="number"
//                   min="0"
//                   value={
//                     form.originalPrice
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "originalPrice",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Currency
//                 </label>

//                 <select
//                   value={
//                     form.currency
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "currency",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
//                 >
//                   <option value="UGX">
//                     UGX
//                   </option>
//                   <option value="USD">
//                     USD
//                   </option>
//                   <option value="EUR">
//                     EUR
//                   </option>
//                   <option value="GBP">
//                     GBP
//                   </option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Availability
//                 </label>

//                 <select
//                   value={
//                     form.availability
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "availability",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
//                 >
//                   <option value="in_stock">
//                     In Stock
//                   </option>
//                   <option value="out_of_stock">
//                     Out of Stock
//                   </option>
//                   <option value="made_to_order">
//                     Made to Order
//                   </option>
//                   <option value="pre_order">
//                     Pre-order
//                   </option>
//                   <option value="available_on_request">
//                     Available on Request
//                   </option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Quantity
//                 </label>

//                 <input
//                   type="number"
//                   min="0"
//                   value={
//                     form.quantity
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "quantity",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Lead Time
//                 </label>

//                 <input
//                   value={
//                     form.leadTime
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "leadTime",
//                       event.target.value,
//                     )
//                   }
//                   placeholder="e.g. 8–12 weeks"
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <label className="flex items-center gap-3 md:col-span-3">
//                 <input
//                   type="checkbox"
//                   checked={
//                     form.inStock
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "inStock",
//                       event.target.checked,
//                     )
//                   }
//                   className="h-4 w-4"
//                 />

//                 <span className="text-sm">
//                   Product is currently in stock
//                 </span>
//               </label>
//             </div>
//           </section>

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 06
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 Physical Information
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6 md:grid-cols-2">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Weight
//                 </label>

//                 <input
//                   type="number"
//                   min="0"
//                   value={
//                     form.weight
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "weight",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Weight Unit
//                 </label>

//                 <select
//                   value={
//                     form.weightUnit
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "weightUnit",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm"
//                 >
//                   <option value="kg">
//                     Kilograms
//                   </option>
//                   <option value="g">
//                     Grams
//                   </option>
//                   <option value="lb">
//                     Pounds
//                   </option>
//                 </select>
//               </div>
//             </div>
//           </section>

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 07
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 Google Merchant
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6 md:grid-cols-2">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Google Product Category ID
//                 </label>

//                 <input
//                   value={
//                     form.googleProductCategoryId
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "googleProductCategoryId",
//                       event.target.value,
//                     )
//                   }
//                   placeholder="Inherited from subcategory when available"
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Google Product Category Path
//                 </label>

//                 <input
//                   value={
//                     form.googleProductCategoryPath
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "googleProductCategoryPath",
//                       event.target.value,
//                     )
//                   }
//                   placeholder="Home & Garden > Furniture > ..."
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600 md:col-span-2">
//                 Google synchronization will happen after
//                 the product has the required information,
//                 images and storefront URL. Creating the
//                 product here does not automatically publish
//                 it to Google.
//               </div>
//             </div>
//           </section>

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 08
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 SEO
//               </h2>
//             </div>

//             <div className="grid gap-5 p-6">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   Canonical URL
//                 </label>

//                 <input
//                   value={
//                     form.canonicalUrl
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "canonicalUrl",
//                       event.target.value,
//                     )
//                   }
//                   placeholder="https://therevampug.com/collections/..."
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   SEO Title
//                 </label>

//                 <input
//                   value={
//                     form.seoTitle
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "seoTitle",
//                       event.target.value,
//                     )
//                   }
//                   maxLength={255}
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">
//                   SEO Description
//                 </label>

//                 <textarea
//                   rows={4}
//                   value={
//                     form.seoDescription
//                   }
//                   onChange={(event) =>
//                     updateField(
//                       "seoDescription",
//                       event.target.value,
//                     )
//                   }
//                   className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
//                 />
//               </div>
//             </div>
//           </section>

//           <section className="rounded-xl border border-neutral-200 bg-white">
//             <div className="border-b border-neutral-200 px-6 py-5">
//               <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
//                 09
//               </p>

//               <h2 className="mt-1 text-lg font-medium">
//                 Merchandising
//               </h2>
//             </div>

//             <div className="grid gap-3 p-6 md:grid-cols-2">
//               {[
//                 [
//                   "featured",
//                   "Featured Product",
//                 ],
//                 [
//                   "isNewArrival",
//                   "New Arrival",
//                 ],
//                 [
//                   "isBestSeller",
//                   "Best Seller",
//                 ],
//                 [
//                   "isOnSale",
//                   "On Sale",
//                 ],
//               ].map(
//                 ([key, label]) => (
//                   <label
//                     key={key}
//                     className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={
//                         Boolean(
//                           form[
//                             key as keyof FormState
//                           ],
//                         ),
//                       },
//                       onChange={(event) =>
//                         updateField(
//                           key as keyof FormState,
//                           event.target.checked,
//                         )
//                       }
//                       className="h-4 w-4"
//                     />

//                     <span className="text-sm font-medium">
//                       {label}
//                     </span>
//                   </label>
//                 ),
//               )}
//             </div>
//           </section>

//           <section className="sticky bottom-4 z-20 rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
//             <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
//               <div>
//                 <p className="text-sm font-medium">
//                   Ready to save?
//                 </p>

//                 <p className="text-xs text-neutral-500">
//                   Products can be reviewed before publishing
//                   to the storefront or Google.
//                 </p>
//               </div>

//               <div className="flex flex-col gap-2 sm:flex-row">
//                 <button
//                   type="button"
//                   disabled={saving}
//                   onClick={() =>
//                     handleSubmit("draft")
//                   }
//                   className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50"
//                 >
//                   {saving
//                     ? "Saving..."
//                     : "Save Draft"}
//                 </button>

//                 <button
//                   type="button"
//                   disabled={saving}
//                   onClick={() =>
//                     handleSubmit(
//                       "ready_for_review",
//                     )
//                   }
//                   className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
//                 >
//                   {saving
//                     ? "Submitting..."
//                     : "Submit for Review"}
//                 </button>
//               </div>
//             </div>
//           </section>
//         </div>
//       </div>
//     </main>
//   )
// }
