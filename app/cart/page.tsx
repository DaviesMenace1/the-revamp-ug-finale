'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { X, Plus, Minus, MessageCircle, Trash2, Download, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function CartPage() {
  const { 
    items, 
    cart, 
    customerName, 
    setCustomerName, 
    removeFromCart, 
    updateQuantity, 
    clearCart 
  } = useCart()
  const [isDownloading, setIsDownloading] = useState(false)

  // Helper to ensure full absolute image URL for WhatsApp preview
  const getAbsoluteUrl = (path?: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
  }

  // 1. Enhanced Share to WhatsApp
const { items, cart, customerName, setCustomerName } = useCart()

const shareToWhatsApp = () => {
    let name = customerName
    if (!name || name.trim() === '') {
      const inputName = window.prompt("Please enter your name for the order enquiry:")
      if (!inputName) return
      name = inputName.trim()
      setCustomerName(name)
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    const compactPayload = items.map((item) => ({
      i: item.productId,
      q: item.quantity,
      c: item.selectedColor?.name || item.selectedColor,
      v: item.selectedVariant?.name || item.selectedVariant,
      a: item.selectedAccessories?.map((acc: any) => acc.name || acc),
      d: item.customDimensions,
      n: item.product.name,
      pr: item.product.salePrice || item.product.price,
      cur: item.product.currency || '$',
      img: item.product.images?.[0] || '',
      s: item.product.slug || ''
    }))

    const encodedCart = encodeURIComponent(btoa(JSON.stringify(compactPayload)))
    const cartShareLink = `${baseUrl}/cart?c=${encodedCart}&name=${encodeURIComponent(name)}`

    const formattedItems = items.map((item, idx) => {
      const price = (item.product.salePrice || item.product.price) * item.quantity
      const details: string[] = []

      if (item.selectedColor) details.push(`Color: ${item.selectedColor.name || item.selectedColor}`)
      if (item.selectedVariant) details.push(`Variant: ${item.selectedVariant.name || item.selectedVariant}`)
      if (item.selectedAccessories?.length) {
        details.push(`Accessories: ${item.selectedAccessories.map((a: any) => a.name || a).join(', ')}`)
      }
      if (item.customDimensions) {
        const { width, depth } = item.customDimensions
        if (width || depth) details.push(`Dims: ${width ? `${width}″W` : ''}${depth ? `×${depth}″D` : ''}`)
      }

      const detailText = details.length > 0 ? `\n   (${details.join(' | ')})` : ''
      return `${idx + 1}. *${item.product.name}* × ${item.quantity}${detailText}\n   *Subtotal:* ${item.product.currency || '$'} ${price.toLocaleString()}`
    }).join('\n\n')

    const message = `🛍️ *NEW CART ENQUIRY*\n👤 *Customer:* ${name}\n\n${formattedItems}\n\n------------------------------\n💰 *TOTAL:* ${items[0]?.product.currency || '$'} ${cart?.total.toLocaleString() ?? '0'}\n------------------------------\n\n🔗 *View Cart & Images:* \n${cartShareLink}`

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }





  // 2. Download Images Feature (Bundles into ZIP)
  const downloadCartImages = async () => {
    try {
      setIsDownloading(true)
      const zip = new JSZip()
      const folder = zip.folder("cart_images")

      const downloadPromises = items.map(async (item, idx) => {
        const imgUrl = item.product.images?.[0]
        if (!imgUrl) return

        try {
          const response = await fetch(imgUrl)
          const blob = await response.blob()
          const fileExtension = imgUrl.split('.').pop()?.split('?')[0] || 'jpg'
          const safeName = item.product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          folder?.file(`${idx + 1}_${safeName}.${fileExtension}`, blob)
        } catch (err) {
          console.error(`Failed to download image for ${item.product.name}:`, err)
        }
      })

      await Promise.all(downloadPromises)
      const zipContent = await zip.generateAsync({ type: "blob" })
      saveAs(zipContent, "the-revamp-ug-cart-images.zip")
    } catch (error) {
      console.error("Error zipping images:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center py-16">
            <h1 className="font-serif text-4xl font-bold mb-8">Shopping Cart</h1>
            <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
            <Button className="bg-primary text-primary-foreground">
              <Link href="/collections">Continue Shopping</Link>
            </Button>
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
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>

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
                  const addOns = (item as any).addOns || (item as any).selectedAddons

                  return (
                    <div key={item.productId} className="flex gap-6 pb-6 border-b border-border">
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
                            <h3 className="font-serif text-lg font-semibold hover:text-accent transition-colors">
                              {item.product.name}
                            </h3>
                          </Link>

                          {/* Options / Variants / Addons */}
                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            {item.selectedColor && (
                              <p>Color: {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.name}</p>
                            )}
                            {item.selectedVariant && (
                              <p>Variant: {typeof item.selectedVariant === 'string' ? item.selectedVariant : item.selectedVariant.name}</p>
                            )}
                            {item.customDimensions && (
                              <p>
                                Dimensions: {item.customDimensions.width}″ W {item.customDimensions.depth && `× ${item.customDimensions.depth}″ D`}
                              </p>
                            )}
                            {Array.isArray(addOns) && addOns.length > 0 && (
                              <p>Add-ons: {addOns.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}</p>
                            )}
                          </div>
                        </div>

                        <p className="font-serif text-lg font-bold">${price.toLocaleString()}</p>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col items-end justify-between">
                        <div className="flex items-center border border-border rounded">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 hover:bg-muted">
                            <Minus size={16} />
                          </button>
                          <span className="px-3 py-1 font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 hover:bg-muted">
                            <Plus size={16} />
                          </button>
                        </div>

                        <button onClick={() => removeFromCart(item.productId)} className="text-destructive hover:text-destructive/80 p-2">
                          <X size={20} />
                        </button>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-serif text-lg font-bold">${itemTotal.toLocaleString()}</p>
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
                <div className="bg-muted rounded-lg p-8 sticky top-24 space-y-6">
                  <h2 className="font-serif text-2xl font-bold">Order Summary</h2>

                  <div className="space-y-4 pb-6 border-b border-border">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${cart.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%)</span>
                      <span>${cart.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${cart.shipping.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-serif text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-accent">${cart.total.toLocaleString()}</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button className="w-full bg-primary py-6">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <Button onClick={shareToWhatsApp} variant="outline" className="w-full border-border bg-green-500/10 text-green-600 hover:bg-green-500/20">
                      <MessageCircle className="mr-2 h-4 w-4" /> Send Cart to WhatsApp
                    </Button>

                    <Button onClick={downloadCartImages} disabled={isDownloading} variant="outline" className="w-full border-border">
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Downloading Images...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" /> Download Cart Images
                        </>
                      )}
                    </Button>

                    <Button onClick={clearCart} variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
