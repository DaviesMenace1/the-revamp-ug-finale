import {
  db,
  departments,
  categories,
  subCategories,
  attributeTemplates,
} from "@/lib/db"
import { eq } from "drizzle-orm"

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
  options?: Array<{
    label: string
    value: string
  }>
  library?:
    | "color_library"
    | "material_library"
    | "fabric_library"
    | "finish_library"
}

type Template = {
  name: string
  slug: string
  description: string
  fields: Field[]
}

const templates: Template[] = [
  {
    name: "Furniture - Seating",
    slug: "furniture-seating",
    description: "Attributes for sofas, chairs, benches and other upholstered seating.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "seatHeight",
        label: "Seat Height",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "seatDepth",
        label: "Seat Depth",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "seatingCapacity",
        label: "Seating Capacity",
        type: "number",
      },
      {
        key: "frameMaterial",
        label: "Frame Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "upholstery",
        label: "Upholstery",
        type: "fabric",
        library: "fabric_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "indoorOutdoor",
        label: "Indoor / Outdoor",
        type: "select",
        options: [
          { label: "Indoor", value: "indoor" },
          { label: "Outdoor", value: "outdoor" },
          { label: "Indoor & Outdoor", value: "both" },
        ],
      },
      {
        key: "assemblyRequired",
        label: "Assembly Required",
        type: "boolean",
      },
      {
        key: "careInstructions",
        label: "Care Instructions",
        type: "textarea",
      },
    ],
  },

  {
    name: "Furniture - Tables",
    slug: "furniture-tables",
    description: "Attributes for dining tables, coffee tables, consoles, side tables and desks.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "diameter",
        label: "Diameter",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "shape",
        label: "Shape",
        type: "select",
        options: [
          { label: "Rectangular", value: "rectangular" },
          { label: "Round", value: "round" },
          { label: "Oval", value: "oval" },
          { label: "Square", value: "square" },
          { label: "Irregular", value: "irregular" },
        ],
      },
      {
        key: "topMaterial",
        label: "Top Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "baseMaterial",
        label: "Base Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "seatingCapacity",
        label: "Seating Capacity",
        type: "number",
      },
      {
        key: "assemblyRequired",
        label: "Assembly Required",
        type: "boolean",
      },
    ],
  },

  {
    name: "Furniture - Storage",
    slug: "furniture-storage",
    description: "Attributes for cabinets, consoles, sideboards, wardrobes and storage furniture.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "doors",
        label: "Number of Doors",
        type: "number",
      },
      {
        key: "drawers",
        label: "Number of Drawers",
        type: "number",
      },
      {
        key: "shelves",
        label: "Number of Shelves",
        type: "number",
      },
      {
        key: "assemblyRequired",
        label: "Assembly Required",
        type: "boolean",
      },
    ],
  },

  {
    name: "Furniture - Beds",
    slug: "furniture-beds",
    description: "Attributes for beds, bed frames, headboards and bedroom furniture.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "length",
        label: "Length",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "mattressSize",
        label: "Mattress Size",
        type: "select",
        options: [
          { label: "Single", value: "single" },
          { label: "Double", value: "double" },
          { label: "Queen", value: "queen" },
          { label: "King", value: "king" },
          { label: "Super King", value: "super_king" },
          { label: "Custom", value: "custom" },
        ],
      },
      {
        key: "frameMaterial",
        label: "Frame Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "upholstery",
        label: "Upholstery",
        type: "fabric",
        library: "fabric_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "storageIncluded",
        label: "Storage Included",
        type: "boolean",
      },
    ],
  },

  {
    name: "Lighting",
    slug: "lighting",
    description: "Attributes for chandeliers, pendants, lamps, sconces and architectural lighting.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "diameter",
        label: "Diameter",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "material",
        label: "Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "bulbType",
        label: "Bulb Type",
        type: "text",
      },
      {
        key: "bulbsRequired",
        label: "Number of Bulbs",
        type: "number",
      },
      {
        key: "wattage",
        label: "Wattage",
        type: "number",
        unit: "W",
      },
      {
        key: "voltage",
        label: "Voltage",
        type: "number",
        unit: "V",
      },
      {
        key: "dimmable",
        label: "Dimmable",
        type: "boolean",
      },
      {
        key: "ipRating",
        label: "IP Rating",
        type: "text",
      },
    ],
  },

  {
    name: "Rugs & Textiles",
    slug: "rugs-textiles",
    description: "Attributes for rugs, carpets, throws and decorative textiles.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "length",
        label: "Length",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "pattern",
        label: "Pattern",
        type: "text",
      },
      {
        key: "pileHeight",
        label: "Pile Height",
        type: "measurement",
        unit: "mm",
      },
      {
        key: "construction",
        label: "Construction",
        type: "select",
        options: [
          { label: "Hand Knotted", value: "hand_knotted" },
          { label: "Hand Tufted", value: "hand_tufted" },
          { label: "Flat Woven", value: "flat_woven" },
          { label: "Machine Made", value: "machine_made" },
        ],
      },
      {
        key: "indoorOutdoor",
        label: "Indoor / Outdoor",
        type: "select",
        options: [
          { label: "Indoor", value: "indoor" },
          { label: "Outdoor", value: "outdoor" },
          { label: "Both", value: "both" },
        ],
      },
    ],
  },

  {
    name: "Decor & Accessories",
    slug: "decor-accessories",
    description: "Attributes for vases, sculptures, trays, objects and decorative accessories.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "material",
        label: "Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "handmade",
        label: "Handmade",
        type: "boolean",
      },
      {
        key: "careInstructions",
        label: "Care Instructions",
        type: "textarea",
      },
    ],
  },

  {
    name: "Art & Mirrors",
    slug: "art-mirrors",
    description: "Attributes for artwork, mirrors, framed pieces and wall objects.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "frameMaterial",
        label: "Frame Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "frameFinish",
        label: "Frame Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "frameColor",
        label: "Frame Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: [
          { label: "Portrait", value: "portrait" },
          { label: "Landscape", value: "landscape" },
          { label: "Square", value: "square" },
        ],
      },
      {
        key: "hangingIncluded",
        label: "Hanging Hardware Included",
        type: "boolean",
      },
    ],
  },

  {
    name: "Outdoor Furniture",
    slug: "outdoor-furniture",
    description: "Attributes for outdoor seating, tables, loungers and garden furniture.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
        required: true,
      },
      {
        key: "frameMaterial",
        label: "Frame Material",
        type: "material",
        library: "material_library",
      },
      {
        key: "finish",
        label: "Finish",
        type: "finish",
        library: "finish_library",
      },
      {
        key: "upholstery",
        label: "Upholstery",
        type: "fabric",
        library: "fabric_library",
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        library: "color_library",
      },
      {
        key: "weatherResistant",
        label: "Weather Resistant",
        type: "boolean",
      },
      {
        key: "uvResistant",
        label: "UV Resistant",
        type: "boolean",
      },
      {
        key: "waterResistant",
        label: "Water Resistant",
        type: "boolean",
      },
    ],
  },

  {
    name: "Custom & Bespoke",
    slug: "custom-bespoke",
    description: "Attributes for products requiring custom specifications.",
    fields: [
      {
        key: "width",
        label: "Width",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "depth",
        label: "Depth",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "height",
        label: "Height",
        type: "measurement",
        unit: "cm",
      },
      {
        key: "materials",
        label: "Materials",
        type: "multiselect",
        library: "material_library",
      },
      {
        key: "finishes",
        label: "Finishes",
        type: "multiselect",
        library: "finish_library",
      },
      {
        key: "fabrics",
        label: "Fabrics",
        type: "multiselect",
        library: "fabric_library",
      },
      {
        key: "colors",
        label: "Colors",
        type: "multiselect",
        library: "color_library",
      },
      {
        key: "customNotes",
        label: "Custom Specification Notes",
        type: "textarea",
      },
    ],
  },
]

const taxonomy = [
  {
    department: {
      name: "Furniture",
      slug: "furniture",
      description: "Furniture for refined residential, hospitality and commercial interiors.",
    },
    categories: [
      {
        name: "Living",
        slug: "living",
        subCategories: [
          { name: "Sofas", slug: "sofas", template: "furniture-seating" },
          { name: "Armchairs", slug: "armchairs", template: "furniture-seating" },
          { name: "Benches", slug: "benches", template: "furniture-seating" },
          { name: "Coffee Tables", slug: "coffee-tables", template: "furniture-tables" },
          { name: "Side Tables", slug: "side-tables", template: "furniture-tables" },
          { name: "Console Tables", slug: "console-tables", template: "furniture-tables" },
          { name: "TV Units", slug: "tv-units", template: "furniture-storage" },
        ],
      },
      {
        name: "Dining",
        slug: "dining",
        subCategories: [
          { name: "Dining Tables", slug: "dining-tables", template: "furniture-tables" },
          { name: "Dining Chairs", slug: "dining-chairs", template: "furniture-seating" },
          { name: "Bar Stools", slug: "bar-stools", template: "furniture-seating" },
          { name: "Bar Tables", slug: "bar-tables", template: "furniture-tables" },
          { name: "Sideboards", slug: "sideboards", template: "furniture-storage" },
        ],
      },
      {
        name: "Bedroom",
        slug: "bedroom",
        subCategories: [
          { name: "Beds", slug: "beds", template: "furniture-beds" },
          { name: "Bedside Tables", slug: "bedside-tables", template: "furniture-tables" },
          { name: "Dressers", slug: "dressers", template: "furniture-storage" },
          { name: "Bedroom Benches", slug: "bedroom-benches", template: "furniture-seating" },
        ],
      },
      {
        name: "Storage",
        slug: "storage",
        subCategories: [
          { name: "Cabinets", slug: "cabinets", template: "furniture-storage" },
          { name: "Bookcases", slug: "bookcases", template: "furniture-storage" },
          { name: "Wardrobes", slug: "wardrobes", template: "furniture-storage" },
          { name: "Shelving", slug: "shelving", template: "furniture-storage" },
        ],
      },
    ],
  },

  {
    department: {
      name: "Lighting",
      slug: "lighting",
      description: "Decorative and architectural lighting.",
    },
    categories: [
      {
        name: "Ceiling Lighting",
        slug: "ceiling-lighting",
        subCategories: [
          { name: "Chandeliers", slug: "chandeliers", template: "lighting" },
          { name: "Pendant Lights", slug: "pendant-lights", template: "lighting" },
          { name: "Flush Mounts", slug: "flush-mounts", template: "lighting" },
        ],
      },
      {
        name: "Lamps",
        slug: "lamps",
        subCategories: [
          { name: "Table Lamps", slug: "table-lamps", template: "lighting" },
          { name: "Floor Lamps", slug: "floor-lamps", template: "lighting" },
        ],
      },
      {
        name: "Wall Lighting",
        slug: "wall-lighting",
        subCategories: [
          { name: "Wall Sconces", slug: "wall-sconces", template: "lighting" },
          { name: "Picture Lights", slug: "picture-lights", template: "lighting" },
        ],
      },
    ],
  },

  {
    department: {
      name: "Rugs & Textiles",
      slug: "rugs-textiles",
      description: "Rugs, carpets and decorative textiles.",
    },
    categories: [
      {
        name: "Rugs",
        slug: "rugs",
        subCategories: [
          { name: "Area Rugs", slug: "area-rugs", template: "rugs-textiles" },
          { name: "Runners", slug: "runners", template: "rugs-textiles" },
          { name: "Outdoor Rugs", slug: "outdoor-rugs", template: "rugs-textiles" },
        ],
      },
      {
        name: "Textiles",
        slug: "textiles",
        subCategories: [
          { name: "Throws", slug: "throws", template: "rugs-textiles" },
          { name: "Cushions", slug: "cushions", template: "rugs-textiles" },
        ],
      },
    ],
  },

  {
    department: {
      name: "Decor & Accessories",
      slug: "decor-accessories",
      description: "Objects and accessories for refined interiors.",
    },
    categories: [
      {
        name: "Decorative Objects",
        slug: "decorative-objects",
        subCategories: [
          { name: "Vases", slug: "vases", template: "decor-accessories" },
          { name: "Sculptures", slug: "sculptures", template: "decor-accessories" },
          { name: "Bowls & Trays", slug: "bowls-trays", template: "decor-accessories" },
          { name: "Decorative Objects", slug: "decorative-objects", template: "decor-accessories" },
        ],
      },
    ],
  },

  {
    department: {
      name: "Art & Mirrors",
      slug: "art-mirrors",
      description: "Art, mirrors and wall objects.",
    },
    categories: [
      {
        name: "Wall Art",
        slug: "wall-art",
        subCategories: [
          { name: "Paintings", slug: "paintings", template: "art-mirrors" },
          { name: "Prints", slug: "prints", template: "art-mirrors" },
          { name: "Photography", slug: "photography", template: "art-mirrors" },
        ],
      },
      {
        name: "Mirrors",
        slug: "mirrors",
        subCategories: [
          { name: "Wall Mirrors", slug: "wall-mirrors", template: "art-mirrors" },
          { name: "Floor Mirrors", slug: "floor-mirrors", template: "art-mirrors" },
        ],
      },
    ],
  },

  {
    department: {
      name: "Outdoor",
      slug: "outdoor",
      description: "Outdoor furniture and objects.",
    },
    categories: [
      {
        name: "Outdoor Furniture",
        slug: "outdoor-furniture",
        subCategories: [
          { name: "Outdoor Sofas", slug: "outdoor-sofas", template: "outdoor-furniture" },
          { name: "Outdoor Chairs", slug: "outdoor-chairs", template: "outdoor-furniture" },
          { name: "Outdoor Tables", slug: "outdoor-tables", template: "outdoor-furniture" },
          { name: "Sun Loungers", slug: "sun-loungers", template: "outdoor-furniture" },
        ],
      },
    ],
  },

  {
    department: {
      name: "Custom & Bespoke",
      slug: "custom-bespoke",
      description: "Bespoke and made-to-measure products.",
    },
    categories: [
      {
        name: "Bespoke Furniture",
        slug: "bespoke-furniture",
        subCategories: [
          { name: "Custom Sofas", slug: "custom-sofas", template: "custom-bespoke" },
          { name: "Custom Tables", slug: "custom-tables", template: "custom-bespoke" },
          { name: "Custom Storage", slug: "custom-storage", template: "custom-bespoke" },
        ],
      },
    ],
  },
]

export async function seedProductTaxonomy() {
  const templateMap = new Map<string, string>()

  for (const template of templates) {
    const existing = await db.query.attributeTemplates.findFirst({
      where: eq(attributeTemplates.slug, template.slug),
    })

    if (existing) {
      await db
        .update(attributeTemplates)
        .set({
          name: template.name,
          description: template.description,
          schemaDefinition: {
            version: 1,
            fields: template.fields,
          },
          updatedAt: new Date(),
        })
        .where(eq(attributeTemplates.id, existing.id))

      templateMap.set(template.slug, existing.id)
    } else {
      const [created] = await db
        .insert(attributeTemplates)
        .values({
          name: template.name,
          slug: template.slug,
          description: template.description,
          version: 1,
          schemaDefinition: {
            version: 1,
            fields: template.fields,
          },
        })
        .returning({
          id: attributeTemplates.id,
        })

      templateMap.set(template.slug, created.id)
    }
  }

  for (const departmentData of taxonomy) {
    const existingDepartment =
      await db.query.departments.findFirst({
        where: eq(
          departments.slug,
          departmentData.department.slug,
        ),
      })

    let departmentId: string

    if (existingDepartment) {
      departmentId = existingDepartment.id
    } else {
      const [created] = await db
        .insert(departments)
        .values({
          name: departmentData.department.name,
          slug: departmentData.department.slug,
          description: departmentData.department.description,
        })
        .returning({
          id: departments.id,
        })

      departmentId = created.id
    }

    for (
      const [categoryIndex, categoryData] of departmentData.categories.entries()
    ) {
      const existingCategory =
        await db.query.categories.findFirst({
          where: eq(categories.slug, categoryData.slug),
        })

      let categoryId: string

      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const [created] = await db
          .insert(categories)
          .values({
            departmentId,
            name: categoryData.name,
            slug: categoryData.slug,
            order: categoryIndex,
          })
          .returning({
            id: categories.id,
          })

        categoryId = created.id
      }

      for (
        const [subIndex, subCategoryData] of categoryData.subCategories.entries()
      ) {
        const templateId =
          templateMap.get(subCategoryData.template)

        const existingSubCategory =
          await db.query.subCategories.findFirst({
            where: eq(
              subCategories.slug,
              subCategoryData.slug,
            ),
          })

        if (existingSubCategory) {
          await db
            .update(subCategories)
            .set({
              categoryId,
              templateId,
              name: subCategoryData.name,
              order: subIndex,
              updatedAt: new Date(),
            })
            .where(
              eq(
                subCategories.id,
                existingSubCategory.id,
              ),
            )
        } else {
          await db.insert(subCategories).values({
            categoryId,
            templateId,
            name: subCategoryData.name,
            slug: subCategoryData.slug,
            order: subIndex,
          })
        }
      }
    }
  }
}