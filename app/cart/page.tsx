'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { X, Plus, Minus, MessageCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, cart } = useCart()

  const shareToWhatsApp = () => {
    const lines = items.map((item) => `${item.product.name} × ${item.quantity} — ${item.product.currency} ${((item.product.salePrice || item.product.price) * item.quantity).toLocaleString()}`)
    const message = `Hello The Revamp UG, I would like to enquire about this cart:\n\n${lines.join('\n')}\n\nTotal: ${cart?.total.toLocaleString() ?? '0'}`
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
                Shopping Cart
              </h1>
              
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-6">
                  Your cart is empty
                </p>
                <Button  className="bg-primary text-primary-foreground">
                  <Link href="/products">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
              Shopping Cart
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="space-y-4 mb-8 pb-8 border-b border-border">
                  <p className="text-sm text-muted-foreground">
                    {items.length} item{items.length !== 1 ? 's' : ''} in cart
                  </p>
                </div>

                <div className="space-y-6">
                  {items.map((item) => {
                    const price = item.product.salePrice || item.product.price
                    const itemTotal = price * item.quantity

                    return (
                      <div
                        key={item.productId}
                        className="flex gap-6 pb-6 border-b border-border"
                      >
                        {/* Image */}
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="150px"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <Link href={`/products/${item.product.slug}`}>
                              <h3 className="font-serif text-lg font-semibold text-foreground hover:text-accent transition-colors">
                                {item.product.name}
                              </h3>
                            </Link>

                            {/* Color & Variant */}
                            <div className="text-sm text-muted-foreground mt-2">
                              {item.selectedColor && (
                                <p>Color: {item.selectedColor.name}</p>
                              )}
                              {item.selectedVariant && (
                                <p>Variant: {item.selectedVariant.name}</p>
                              )}
                              {item.customDimensions && (
                                <p>
                                  Dimensions: {item.customDimensions.width}
                                  {item.customDimensions.width && '″ W'} {item.customDimensions.depth && `× ${item.customDimensions.depth}″ D`}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Price */}
                          <p className="font-serif text-lg font-bold text-foreground">
                            ${price.toLocaleString()}
                          </p>
                        </div>

                        {/* Quantity & Remove */}
                        <div className="flex flex-col items-end justify-between">
                          {/* Quantity */}
                          <div className="flex items-center border border-border rounded">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="p-1 hover:bg-muted"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-3 py-1 font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="p-1 hover:bg-muted"
                              aria-label="Increase quantity"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-destructive hover:text-destructive/80 transition-colors p-2"
                            aria-label="Remove from cart"
                          >
                            <X size={20} />
                          </button>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Subtotal</p>
                            <p className="font-serif text-lg font-bold text-foreground">
                              ${itemTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Order Summary */}
              {cart && (
                <div className="lg:col-span-1">
                  <div className="bg-muted rounded-lg p-8 sticky top-24">
                    <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                      Order Summary
                    </h2>

                    <div className="space-y-4 mb-8 pb-8 border-b border-border">
                      <div className="flex justify-between text-foreground">
                        <span>Subtotal</span>
                        <span>${cart.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-foreground">
                        <span>Tax (10%)</span>
                        <span>${cart.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-foreground">
                        <span>Shipping</span>
                        <span>${cart.shipping.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between mb-8">
                      <span className="font-serif text-xl font-bold text-foreground">
                        Total
                      </span>
                      <span className="font-serif text-2xl font-bold text-accent">
                        ${cart.total.toLocaleString()}
                      </span>
                    </div>

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-opacity-90 py-6 mb-4"
                    >
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <Button onClick={shareToWhatsApp} variant="outline" className="w-full border-border mb-3">
                      <MessageCircle className="mr-2" /> Send Cart to WhatsApp
                    </Button>

                    <Button onClick={clearCart} variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                      <Trash2 className="mr-2" /> Clear Cart
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-border"
                    >
                      <Link href="/products">
                        Continue Shopping
                      </Link>
                    </Button>

                    {/* Trust Badges */}
                    <div className="mt-8 pt-8 border-t border-border space-y-3 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                         Free shipping on orders over $5,000
                      </p>
                      <p className="flex items-center gap-2">
                         Secure checkout
                      </p>
                      <p className="flex items-center gap-2">
                         10-day returns
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
