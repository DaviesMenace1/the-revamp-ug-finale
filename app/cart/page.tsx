'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronDown,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'

function formatPrice(
  value: number,
  currency = 'UGX'
) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    maximumFractionDigits:
      currency === 'UGX' ? 0 : 2,
  }).format(Number(value) || 0)
}

function getImage(item: any) {
  return (
    item.image ||
    item.selectedColor?.image ||
    item.selectedVariant?.image ||
    item.product?.thumbnailImage ||
    item.product?.images?.[0] ||
    '/placeholder.jpg'
  )
}

function Option({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return (
    <div className="flex gap-2 text-xs leading-5">
      <span className="text-neutral-400">
        {label}
      </span>

      <span className="text-neutral-800">
        {value}
      </span>
    </div>
  )
}

function ProductOptions({
  item,
}: {
  item: any
}) {
  const color =
    item.selectedColor?.label ||
    item.selectedColor?.name

  const fabric =
    item.selectedFabric?.label ||
    item.selectedFabric?.name

  const material =
    item.selectedMaterial?.label ||
    item.selectedMaterial?.name

  const variant =
    item.selectedVariant?.label ||
    item.selectedVariant?.name

  const accessories =
    Array.isArray(item.selectedAccessories)
      ? item.selectedAccessories
          .map(
            (item: any) =>
              item.label || item.name
          )
          .filter(Boolean)
          .join(', ')
      : ''

  const dimensions =
    item.customDimensions

  const dimensionText =
    dimensions &&
    Object.entries(dimensions)
      .filter(
        ([key, value]) =>
          key !== 'unit' &&
          value !== undefined &&
          value !== ''
      )
      .map(
        ([key, value]) =>
          `${key}: ${value}`
      )
      .join(' × ')

  const unit =
    dimensions?.unit || 'cm'

  return (
    <div className="mt-4 space-y-1 border-t border-neutral-200 pt-3">
      <Option
        label="Colour"
        value={color}
      />

      <Option
        label="Fabric"
        value={fabric}
      />

      <Option
        label="Material"
        value={material}
      />

      <Option
        label="Variant"
        value={variant}
      />

      <Option
        label="Add-ons"
        value={accessories}
      />

      {dimensionText && (
        <Option
          label="Custom dimensions"
          value={`${dimensionText} ${unit}`}
        />
      )}
    </div>
  )
}

export default function CartPage() {
  const {
    items,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoaded,
  } = useCart()

  if (!isLoaded) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-screen flex items-center justify-center">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            Loading your cart...
          </p>
        </main>

        <SiteFooter />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />

        <main className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <ShoppingBag className="mx-auto mb-6 h-10 w-10 text-neutral-400" />

            <h1 className="font-serif text-4xl">
              Your cart is empty
            </h1>

            <p className="mt-4 text-sm leading-7 text-neutral-500">
              Discover furniture, lighting,
              architectural finishes and
              beautifully sourced pieces from
              The Revamp UG.
            </p>

            <Button
              asChild
              className="mt-8 rounded-none bg-neutral-950 px-8"
            >
              <Link href="/collections">
                Explore Collections
                <ArrowRight
                  className="ml-2 h-4 w-4"
                />
              </Link>
            </Button>
          </div>
        </main>

        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-[#FAF8F5] px-5 pb-24 pt-32 md:px-10">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                Your selection
              </p>

              <h1 className="mt-3 font-serif text-4xl md:text-5xl">
                Cart
              </h1>
            </div>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Clear everything from your cart?'
                  )
                ) {
                  clearCart()
                }
              }}
              className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
            >
              Clear cart
            </button>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">

            <section className="space-y-5">
              {items.map((item) => {
                const unitPrice =
                  Number(
                    item.unitPrice ??
                      item.product?.price ??
                      0
                  )

                const total =
                  unitPrice * item.quantity

                return (
                  <article
                    key={item.cartItemId}
                    className="border border-neutral-200 bg-white p-5 md:p-6"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row">

                      <Link
                        href={`/collections/${item.product.slug}`}
                        className="relative block h-40 w-full shrink-0 overflow-hidden bg-neutral-100 sm:h-36 sm:w-36"
                      >
                        <Image
                          src={getImage(item)}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={`/collections/${item.product.slug}`}
                              className="font-serif text-2xl hover:underline"
                            >
                              {item.product.name}
                            </Link>

                            {item.product.sku && (
                              <p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">
                                SKU {item.product.sku}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.cartItemId
                              )
                            }
                            className="text-neutral-400 hover:text-red-700"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <ProductOptions
                          item={item}
                        />

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

                          <div className="flex items-center border border-neutral-300">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1
                                )
                              }
                              className="p-2 hover:bg-neutral-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>

                            <span className="min-w-10 text-center text-xs">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1
                                )
                              }
                              className="p-2 hover:bg-neutral-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-neutral-400">
                              {formatPrice(
                                unitPrice,
                                item.product.currency
                              )}{' '}
                              each
                            </p>

                            <p className="mt-1 font-serif text-xl">
                              {formatPrice(
                                total,
                                item.product.currency
                              )}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            <aside className="h-fit border border-neutral-200 bg-white p-6 lg:sticky lg:top-28">

              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                Order summary
              </p>

              <div className="mt-6 space-y-4 border-b border-neutral-200 pb-6">

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(
                      cart?.subtotal || 0,
                      items[0]?.product?.currency ||
                        'UGX'
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Delivery
                  </span>

                  <span>
                    Calculated after quotation
                  </span>
                </div>

              </div>

              <div className="flex justify-between py-6">
                <span className="font-serif text-xl">
                  Estimated total
                </span>

                <span className="font-serif text-xl">
                  {formatPrice(
                    cart?.total || 0,
                    items[0]?.product?.currency ||
                      'UGX'
                  )}
                </span>
              </div>

              <Button
                asChild
                className="h-12 w-full rounded-none bg-neutral-950 uppercase tracking-widest text-xs"
              >
                <Link href="/checkout">
                  Continue to checkout
                </Link>
              </Button>

              <p className="mt-4 text-center text-[11px] leading-5 text-neutral-500">
                Final delivery, installation and
                customisation costs may be confirmed
                during quotation.
              </p>

            </aside>

          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}