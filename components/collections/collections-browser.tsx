"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

type Collection = {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  productCount?: number
}

type Props = {
  collections?: Collection[]
}

export default function CollectionsBrowser({
  collections = [],
}: Props) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"name" | "products">("name")

  const filteredCollections = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = query
      ? collections.filter(
          (collection) =>
            collection.name.toLowerCase().includes(query) ||
            collection.description?.toLowerCase().includes(query),
        )
      : collections

    return [...filtered].sort((a, b) => {
      if (sort === "products") {
        return (b.productCount ?? 0) - (a.productCount ?? 0)
      }

      return a.name.localeCompare(b.name)
    })
  }, [collections, search, sort])

  return (
    <section className="w-full">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Collections
          </p>

          <h1 className="text-3xl font-semibold tracking-tight">
            Explore our collections
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search collections...."
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "name" | "products")
            }
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          >
            <option value="name">Sort by name</option>
            <option value="products">Sort by products</option>
          </select>
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-medium">No collections found</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Try changing your search or check back later for new collections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group overflow-hidden rounded-lg border bg-background transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {collection.imageUrl ? (
                  <Image
                    src={collection.imageUrl}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium tracking-tight">
                      {collection.name}
                    </h2>

                    {collection.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {collection.description}
                      </p>
                    )}
                  </div>

                  {typeof collection.productCount === "number" && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {collection.productCount}{" "}
                      {collection.productCount === 1 ? "product" : "products"}
                    </span>
                  )}
                </div>

                <div className="mt-5 text-xs font-medium uppercase tracking-[0.18em]">
                  View collection
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

