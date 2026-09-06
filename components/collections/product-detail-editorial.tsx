'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, Heart, Ruler, Send, Share2, ShoppingBag, ShieldCheck, Sparkle, Truck } from '@/components/ui/luxury-icons'
import { useCart } from '@/lib/context/cart-context'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls, resolveProductVariantImage } from '@/lib/utils'
import { ProductShareSheet } from '@/components/collections/product-share-sheet'
import { getProductDimensions } from '@/lib/product-dimensions'

const WISHLIST_STORAGE_KEY = 'revamp:wishlist'

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className="border-b border-border/70"><button type="button" onClick={onToggle} className="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-medium text-foreground"><span>{title}</span><ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} /></button>{open && <div className="pb-5 text-sm leading-7 text-muted-foreground">{children}</div>}</div>
}

function isCustomProduct(product: any) {
  const type = String(product?.productType || '').toLowerCase()
  const availability = String(product?.availability || '').toLowerCase()
  return Boolean(product?.customizationEnabled) || ['made_to_order', 'custom_bespoke', 'sourced_on_request'].includes(type) || ['made_to_order', 'available_on_request', 'pre_order'].includes(availability)
}

function safeOptions(product: any, type: string) {
  return (Array.isArray(product?.productVariants) ? product.productVariants : []).filter((variant: any) => String(variant?.type || '').toUpperCase() === type)
}

export function EditorialProductDetail({ product }: { product: any }) {
  const cart = useCart() as any
  const images = resolveProductImageUrls(product)
  const gallery = images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE]
  const colors = safeOptions(product, 'COLOR')
  const fabrics = safeOptions(product, 'FABRIC')
  const materials = safeOptions(product, 'MATERIAL')
  const variants = (Array.isArray(product?.productVariants) ? product.productVariants : []).filter((variant: any) => !['COLOR', 'FABRIC', 'MATERIAL'].includes(String(variant?.type || '').toUpperCase()))
  const accessories = Array.isArray(product?.addons) ? product.addons : []
  const dimensions = getProductDimensions(product)
  const customizable = isCustomProduct(product)
  const [selectedImage, setSelectedImage] = useState(gallery[0])
  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || null)
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0] || null)
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null)
  const [selectedAccessories, setSelectedAccessories] = useState<any[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [added, setAdded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [openSection, setOpenSection] = useState(customizable ? 'customization' : 'details')
  const [useCustomDimensions, setUseCustomDimensions] = useState(false)
  const [customDimensions, setCustomDimensions] = useState({ width: '', height: '', depth: '' })

  useEffect(() => {
    if (!product?.id) return
    try {
      const saved = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]')
      setIsWishlisted(saved.includes(product.id))
    } catch { setIsWishlisted(false) }
  }, [product?.id])

  const toggleWishlist = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]')
      const next = saved.includes(product.id) ? saved.filter((id) => id !== product.id) : [...saved, product.id]
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next))
      setIsWishlisted(next.includes(product.id))
      window.dispatchEvent(new CustomEvent('revamp:wishlist-change'))
    } catch { setIsWishlisted(false) }
  }

  const optionPrice = (option: any) => Number(option?.priceDelta ?? option?.price ?? 0) || 0
  const basePrice = Number(product?.salePrice ?? product?.price ?? 0)
  const unitPrice = useMemo(() => basePrice + optionPrice(selectedFabric) + optionPrice(selectedMaterial) + optionPrice(selectedVariant) + selectedAccessories.reduce((sum, item) => sum + optionPrice(item), 0), [basePrice, selectedAccessories, selectedFabric, selectedMaterial, selectedVariant])
  const currency = normalizeCurrency(product?.currency)
  const totalPrice = unitPrice * quantity
  const rating = Number(product?.rating || 0)
  const reviewsCount = Array.isArray(product?.reviews) ? product.reviews.length : Number(product?.ratingCount || 0)
  const category = product?.subCategory?.category?.name || product?.category?.name || product?.category || 'The Revamp collection'
  const productInquiryHref = `/contact?interest=product_inquiry&product=${encodeURIComponent(product?.name || '')}`
  const customHeading = product?.customizationHeading || (String(product?.productType || '').toLowerCase() === 'made_to_order' ? 'Made for your space.' : 'Need a custom variation?')
  const customDescription = product?.customizationDescription || 'Choose a finish, upholstery, or approximate dimensions. Our studio will confirm the final specification, lead time, and quotation with you before production.'
  const customLabel = product?.customizationRequestLabel || 'Request customization'
  const customLeadTime = product?.customizationLeadTime || product?.leadTime || 'Confirmed with your project brief'

  function selectVariant(variant: any, setter: (value: any) => void) {
    setter(variant)
    const image = resolveProductVariantImage(product, variant?.id)
    if (image) setSelectedImage(image)
  }

  function addToCart() {
    const requestedDimensions = useCustomDimensions ? { width: Number(customDimensions.width) || undefined, height: Number(customDimensions.height) || undefined, depth: Number(customDimensions.depth) || undefined } : undefined
    cart.addToCart({ ...product, images: gallery, thumbnailImage: selectedImage, price: basePrice, currency }, quantity, selectedColor, selectedVariant, selectedAccessories, requestedDimensions, selectedFabric, selectedMaterial)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return <div className="space-y-10 lg:space-y-16">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-14">
      <section className="min-w-0">
        <div className="grid gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">{gallery.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(image)} className={`relative aspect-square size-16 shrink-0 overflow-hidden border bg-muted sm:size-[5.5rem] ${selectedImage === image ? 'border-foreground ring-1 ring-foreground' : 'border-border/70 opacity-70 hover:opacity-100'}`} aria-label={`View image ${index + 1}`}><Image src={image} alt="" fill sizes="88px" className="object-cover" /></button>)}</div>
          <div className="order-1 relative aspect-[4/5] overflow-hidden bg-muted sm:order-2 sm:aspect-[4/5]"><Image src={selectedImage} alt={product?.name || 'Product image'} fill priority sizes="(max-width: 1023px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5 pt-20 text-white"><span className="max-w-[70%] font-serif text-3xl leading-none sm:text-5xl">{product?.editorialHighlight || 'A considered piece for meaningful spaces.'}</span><span className="text-[10px] uppercase tracking-[0.16em]">{gallery.indexOf(selectedImage) + 1} / {gallery.length}</span></div></div>
        </div>
      </section>

      <section className="min-w-0 lg:pt-2"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">{product?.brand || category}</p><p className="mt-2 text-xs text-muted-foreground">{category}</p></div><button type="button" onClick={() => setShareOpen(true)} className="inline-flex min-h-10 items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"><Share2 className="size-4" /> Share</button></div><h1 className="mt-4 font-serif text-5xl font-light leading-[0.92] text-foreground sm:text-6xl">{product?.name || 'Untitled piece'}</h1><div className="mt-5 flex flex-wrap items-center gap-3"><span className="font-serif text-2xl text-foreground">{formatMoney(totalPrice, currency)}</span>{reviewsCount > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="text-gold">{'★'.repeat(Math.round(rating || 5))}</span> ({reviewsCount} reviews)</span>}</div><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{product?.description || 'A carefully selected piece with considered proportions, material, and character.'}</p>

        {customizable && <div className="mt-7 border border-primary/40 bg-primary/5 p-5 sm:p-6"><div className="flex items-start gap-3"><Sparkle className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Made to order / customization available</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{customHeading}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{customDescription}</p><p className="mt-3 text-xs font-medium text-foreground">Lead time: {customLeadTime}</p></div></div><button type="button" onClick={() => setOpenSection(openSection === 'customization' ? '' : 'customization')} className="mt-5 inline-flex min-h-11 items-center gap-2 border border-primary px-4 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary hover:text-primary-foreground">{openSection === 'customization' ? 'Hide customization options' : 'Choose your customization'} <ArrowRight className="size-4" /></button>{openSection === 'customization' && <div className="mt-5 space-y-4 border-t border-primary/20 pt-5">{fabrics.length > 0 && <OptionGroup label="Upholstery" options={fabrics} selected={selectedFabric} onSelect={(value) => selectVariant(value, setSelectedFabric)} currency={currency} />}{materials.length > 0 && <OptionGroup label="Material" options={materials} selected={selectedMaterial} onSelect={(value) => selectVariant(value, setSelectedMaterial)} currency={currency} />}{colors.length > 0 && <OptionGroup label="Colour" options={colors} selected={selectedColor} onSelect={(value) => selectVariant(value, setSelectedColor)} currency={currency} />}{customizable && <div><button type="button" onClick={() => setUseCustomDimensions((value) => !value)} className="flex min-h-11 w-full items-center justify-between border border-border bg-background px-3 text-left text-sm"><span>Request a different size</span><span className="text-primary">{useCustomDimensions ? 'Selected' : 'Optional'}</span></button>{useCustomDimensions && <div className="mt-2 grid grid-cols-3 gap-2"><input aria-label="Width" type="number" placeholder="Width" value={customDimensions.width} onChange={(event) => setCustomDimensions({ ...customDimensions, width: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm" /><input aria-label="Height" type="number" placeholder="Height" value={customDimensions.height} onChange={(event) => setCustomDimensions({ ...customDimensions, height: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm" /><input aria-label="Depth" type="number" placeholder="Depth" value={customDimensions.depth} onChange={(event) => setCustomDimensions({ ...customDimensions, depth: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm" /></div>}</div>}<Link href={productInquiryHref} className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary underline-offset-4 hover:underline"><Send className="size-4" /> {customLabel}</Link></div>}</div>}

        <div className="mt-7 space-y-3">{colors.length > 0 && <OptionGroup label="Colour" options={colors} selected={selectedColor} onSelect={(value) => selectVariant(value, setSelectedColor)} currency={currency} />}{fabrics.length > 0 && !customizable && <OptionGroup label="Fabric / material" options={fabrics} selected={selectedFabric} onSelect={(value) => selectVariant(value, setSelectedFabric)} currency={currency} />}{variants.length > 0 && <OptionGroup label="Style / size" options={variants} selected={selectedVariant} onSelect={(value) => selectVariant(value, setSelectedVariant)} currency={currency} />}</div>
        <div className="mt-6 flex flex-wrap items-center gap-3"><div className="inline-flex min-h-12 items-center border border-border"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="size-12 text-lg">−</button><span className="min-w-10 text-center text-sm tabular-nums">{quantity}</span><button type="button" onClick={() => setQuantity((value) => value + 1)} className="size-12 text-lg">+</button></div><button type="button" onClick={addToCart} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-foreground px-5 text-xs uppercase tracking-[0.15em] text-background hover:bg-foreground/90 sm:flex-none sm:min-w-56">{added ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}{added ? 'Added to cart' : 'Add to cart'} <ArrowRight className="size-4" /></button><button type="button" onClick={toggleWishlist} aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'} className={`inline-flex size-12 items-center justify-center border ${isWishlisted ? 'border-rose-400 text-rose-500' : 'border-border text-foreground'}`}><Heart className={isWishlisted ? 'fill-current' : ''} /></button></div>
        <div className="mt-6 grid grid-cols-3 gap-3 border-y border-border/70 py-5 text-center text-[10px] text-muted-foreground"><div><Truck className="mx-auto mb-2 size-5 text-primary" />Worldwide sourcing</div><div><ShieldCheck className="mx-auto mb-2 size-5 text-primary" />Secure payments</div><div><ShoppingBag className="mx-auto mb-2 size-5 text-primary" />White glove delivery</div></div>
        <div className="mt-6 space-y-0 border-t border-border/70"><Accordion title="Product details" open={openSection === 'details'} onToggle={() => setOpenSection(openSection === 'details' ? '' : 'details')}><p>{product?.longDescription || product?.description || 'A considered piece selected for refined interiors.'}</p></Accordion><Accordion title="Dimensions" open={openSection === 'dimensions'} onToggle={() => setOpenSection(openSection === 'dimensions' ? '' : 'dimensions')}><div className="grid grid-cols-2 gap-3">{dimensions.length > 0 ? dimensions.map((item: any) => <div key={item.key} className="border border-border/70 p-3"><span className="block text-xs text-muted-foreground">{item.label}</span><span className="mt-1 block text-foreground">{item.value}{item.unit ? ` ${item.unit}` : ''}</span></div>) : <p>Dimensions will be confirmed with the studio.</p>}</div></Accordion><Accordion title="Materials and care" open={openSection === 'materials'} onToggle={() => setOpenSection(openSection === 'materials' ? '' : 'materials')}><p>{product?.material || 'Material, finish, and care guidance are confirmed for the selected configuration.'}</p></Accordion><Accordion title="Shipping and delivery" open={openSection === 'shipping'} onToggle={() => setOpenSection(openSection === 'shipping' ? '' : 'shipping')}><p>Delivery, installation, and final lead time are confirmed for your location before order fulfilment.</p></Accordion></div>
      </section>
    </div>
    <ProductShareSheet product={{ name: product?.name || '', price: totalPrice, currency, image: selectedImage, description: product?.description }} open={shareOpen} onOpenChange={setShareOpen} />
  </div>
}

function OptionGroup({ label, options, selected, onSelect, currency }: { label: string; options: any[]; selected: any; onSelect: (value: any) => void; currency: string }) {
  return <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground">{label}: <span className="text-primary">{selected?.label || selected?.name || 'Select'}</span></p><div className="flex flex-wrap gap-2">{options.map((option, index) => <button type="button" key={option?.id || index} onClick={() => onSelect(option)} className={`min-h-10 border px-3 text-xs transition-colors ${selected?.id === option?.id ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'}`}>{label.toLowerCase().includes('colour') && <span className="mr-2 inline-block size-3 rounded-full border border-border/70 align-middle" style={{ backgroundColor: option?.value || '#d4d0c8' }} />}{option?.label || option?.name || 'Option'}{optionPriceForDisplay(option) > 0 ? ` (+${formatMoney(optionPriceForDisplay(option), currency)})` : ''}</button>)}</div></div>
}

function optionPriceForDisplay(option: any) { return Number(option?.priceDelta ?? option?.price ?? 0) || 0 }
