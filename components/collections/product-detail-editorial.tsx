'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Box, Check, ChevronDown, Headphones, Heart, Ruler, Send, Share2, ShieldCheck, ShoppingCart, Sparkle, Truck } from '@/components/ui/luxury-icons'
import { useCart } from '@/lib/context/cart-context'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls, resolveProductVariantImage } from '@/lib/utils'
import { ProductShareSheet } from '@/components/collections/product-share-sheet'
import { getProductDimensions } from '@/lib/product-dimensions'

const WISHLIST_STORAGE_KEY = 'revamp:wishlist'
type DetailTab = 'details' | 'dimensions' | 'materials' | 'shipping' | 'reviews'

function isCustomProduct(product: any) {
  const type = String(product?.productType || '').toLowerCase()
  const availability = String(product?.availability || '').toLowerCase()
  return Boolean(product?.customizationEnabled) || ['made_to_order', 'custom_bespoke', 'sourced_on_request'].includes(type) || ['made_to_order', 'available_on_request', 'pre_order'].includes(availability)
}

function safeOptions(product: any, type: string) {
  return (Array.isArray(product?.productVariants) ? product.productVariants : []).filter((variant: any) => String(variant?.type || '').toUpperCase() === type)
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className="border-b border-border/70"><button type="button" onClick={onToggle} className="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-medium text-foreground"><span>{title}</span><ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} /></button>{open && <div className="pb-5 text-sm leading-7 text-muted-foreground">{children}</div>}</div>
}

export function EditorialProductDetail({ product }: { product: any }) {
  const cart = useCart() as any
  const images = resolveProductImageUrls(product)
  const gallery = images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE]
  const colors = safeOptions(product, 'COLOR')
  const fabrics = safeOptions(product, 'FABRIC')
  const materials = safeOptions(product, 'MATERIAL')
  const finishes = safeOptions(product, 'FINISH')
  const variants = (Array.isArray(product?.productVariants) ? product.productVariants : []).filter((variant: any) => !['COLOR', 'FABRIC', 'MATERIAL', 'FINISH'].includes(String(variant?.type || '').toUpperCase()))
  const accessories = Array.isArray(product?.addons) ? product.addons : []
  const dimensions = getProductDimensions(product)
  const customizable = isCustomProduct(product)
  const [selectedImage, setSelectedImage] = useState(gallery[0])
  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || null)
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0] || null)
  const [selectedFinish, setSelectedFinish] = useState(finishes[0] || null)
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null)
  const [selectedAccessories, setSelectedAccessories] = useState<any[]>([])
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [added, setAdded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [openSection, setOpenSection] = useState(customizable ? 'customization' : '')
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
  const tradeOriginalPrice = Number(product?.tradeOriginalPrice || 0)
  const unitPrice = useMemo(() => basePrice + optionPrice(selectedFabric) + optionPrice(selectedMaterial) + optionPrice(selectedFinish) + optionPrice(selectedVariant) + selectedAccessories.reduce((sum, item) => sum + optionPrice(item), 0), [basePrice, selectedAccessories, selectedFabric, selectedFinish, selectedMaterial, selectedVariant])
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

  function optionImage(option: any) {
    return option?.swatchImage || option?.image || resolveProductVariantImage(product, option?.id) || null
  }

  function addToCart() {
    const requestedDimensions = useCustomDimensions ? { width: Number(customDimensions.width) || undefined, height: Number(customDimensions.height) || undefined, depth: Number(customDimensions.depth) || undefined } : undefined
    cart.addToCart({ ...product, images: gallery, thumbnailImage: selectedImage, price: basePrice, currency }, quantity, selectedColor, selectedVariant, selectedAccessories, requestedDimensions, selectedFabric, selectedMaterial, selectedFinish)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  function changeTab(tab: DetailTab) {
    if (tab === 'reviews') {
      document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setActiveTab(tab)
  }

  const tabItems: Array<{ id: DetailTab; label: string }> = [
    { id: 'details', label: 'Details' },
    { id: 'dimensions', label: 'Dimensions' },
    { id: 'materials', label: 'Materials & Care' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'reviews', label: `Reviews${reviewsCount > 0 ? ` (${reviewsCount})` : ''}` },
  ]

  return <div className="space-y-12 lg:space-y-16">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)] lg:gap-14">
      <section className="min-w-0">
        <div className="grid gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">{gallery.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(image)} className={`relative aspect-square size-16 shrink-0 overflow-hidden border bg-muted sm:size-[5.5rem] ${selectedImage === image ? 'border-foreground ring-1 ring-foreground' : 'border-border/70 opacity-70 hover:opacity-100'}`} aria-label={`View image ${index + 1}`}><Image src={image} alt="" fill sizes="88px" className="object-cover" /></button>)}</div>
          <div className="order-1 relative aspect-[4/5] overflow-hidden bg-muted sm:order-2"><Image src={selectedImage} alt={product?.name || 'Product image'} fill priority sizes="(max-width: 639px) 100vw, (max-width: 1023px) 60vw, 55vw" className="object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/10 to-transparent p-5 pt-24 text-white sm:p-7 sm:pt-32"><span className="max-w-[74%] font-serif text-3xl leading-[0.95] sm:text-5xl">{product?.editorialHighlight || 'A considered piece for meaningful spaces.'}</span><span className="text-[10px] uppercase tracking-[0.16em]">{gallery.indexOf(selectedImage) + 1} / {gallery.length}</span></div></div>
        </div>
      </section>

      <section className="min-w-0 lg:pt-1"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">{product?.brand || category}</p><p className="mt-2 text-xs text-muted-foreground">{category}</p></div><button type="button" onClick={() => setShareOpen(true)} className="inline-flex min-h-10 items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"><Share2 className="size-4" /> Share</button></div><h1 className="mt-4 font-serif text-5xl font-light leading-[0.92] text-foreground sm:text-6xl">{product?.name || 'Untitled piece'}</h1><div className="mt-5 flex flex-wrap items-baseline gap-3"><div><div className="flex flex-wrap items-baseline gap-2"><span className="font-serif text-2xl text-foreground">{formatMoney(totalPrice, currency)}</span>{tradeOriginalPrice > basePrice && <span className="text-sm text-muted-foreground line-through">{formatMoney(tradeOriginalPrice * quantity, currency)}</span>}</div>{tradeOriginalPrice > basePrice && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Trade member price</p>}</div>{reviewsCount > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="text-gold">{'★'.repeat(Math.round(rating || 5))}</span> ({reviewsCount} reviews)</span>}</div><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{product?.description || 'A carefully selected piece with considered proportions, material, and character.'}</p>

        {customizable && <div className="mt-7 border border-primary/40 bg-primary/5 p-5 sm:p-6"><div className="flex items-start gap-3"><Sparkle className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Made to order / customization available</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{customHeading}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{customDescription}</p><p className="mt-3 text-xs font-medium text-foreground">Lead time: {customLeadTime}</p></div></div><button type="button" onClick={() => setOpenSection(openSection === 'customization' ? '' : 'customization')} className="mt-5 inline-flex min-h-11 items-center gap-2 border border-primary px-4 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary hover:text-primary-foreground">{openSection === 'customization' ? 'Hide customization options' : 'Choose your customization'} <ArrowRight className="size-4" /></button>{openSection === 'customization' && <div className="mt-5 space-y-4 border-t border-primary/20 pt-5">{fabrics.length > 0 && <OptionGroup label="Upholstery" options={fabrics} selected={selectedFabric} onSelect={(value) => selectVariant(value, setSelectedFabric)} currency={currency} getImage={optionImage} />}{materials.length > 0 && <OptionGroup label="Material" options={materials} selected={selectedMaterial} onSelect={(value) => selectVariant(value, setSelectedMaterial)} currency={currency} getImage={optionImage} />}{finishes.length > 0 && <OptionGroup label="Finish" options={finishes} selected={selectedFinish} onSelect={(value) => selectVariant(value, setSelectedFinish)} currency={currency} getImage={optionImage} />}{colors.length > 0 && <OptionGroup label="Colour" options={colors} selected={selectedColor} onSelect={(value) => selectVariant(value, setSelectedColor)} currency={currency} getImage={optionImage} />}{customizable && <div><button type="button" onClick={() => setUseCustomDimensions((value) => !value)} className="flex min-h-11 w-full items-center justify-between border border-border bg-background px-3 text-left text-sm"><span>Request a different size</span><span className="text-primary">{useCustomDimensions ? 'Selected' : 'Optional'}</span></button>{useCustomDimensions && <div className="mt-2 grid grid-cols-3 gap-2"><input aria-label="Width" type="number" placeholder="Width" value={customDimensions.width} onChange={(event) => setCustomDimensions({ ...customDimensions, width: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm" /><input aria-label="Height" type="number" placeholder="Height" value={customDimensions.height} onChange={(event) => setCustomDimensions({ ...customDimensions, height: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm" /><input aria-label="Depth" type="number" placeholder="Depth" value={customDimensions.depth} onChange={(event) => setCustomDimensions({ ...customDimensions, depth: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm" /></div>}</div>}<Link href={productInquiryHref} className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary underline-offset-4 hover:underline"><Send className="size-4" /> {customLabel}</Link></div>}</div>}

        <div className="mt-7 space-y-4">{colors.length > 0 && <OptionGroup label="Colour" options={colors} selected={selectedColor} onSelect={(value) => selectVariant(value, setSelectedColor)} currency={currency} getImage={optionImage} />}{fabrics.length > 0 && !customizable && <OptionGroup label="Fabric / material" options={fabrics} selected={selectedFabric} onSelect={(value) => selectVariant(value, setSelectedFabric)} currency={currency} getImage={optionImage} />}{finishes.length > 0 && !customizable && <OptionGroup label="Finish" options={finishes} selected={selectedFinish} onSelect={(value) => selectVariant(value, setSelectedFinish)} currency={currency} getImage={optionImage} />}{variants.length > 0 && <OptionGroup label="Style / size" options={variants} selected={selectedVariant} onSelect={(value) => selectVariant(value, setSelectedVariant)} currency={currency} getImage={optionImage} />}</div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"><div className="inline-flex min-h-12 w-fit items-center border border-border"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="size-12 text-lg" aria-label="Decrease quantity">−</button><span className="min-w-10 text-center text-sm tabular-nums">{quantity}</span><button type="button" onClick={() => setQuantity((value) => value + 1)} className="size-12 text-lg" aria-label="Increase quantity">+</button></div><button type="button" onClick={addToCart} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-foreground px-5 text-xs uppercase tracking-[0.15em] text-background hover:bg-foreground/90 sm:min-w-56">{added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}{added ? 'Added to cart' : 'Add to cart'} <ArrowRight className="size-4" /></button><button type="button" onClick={toggleWishlist} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 border px-5 text-xs uppercase tracking-[0.15em] sm:flex-none ${isWishlisted ? 'border-rose-400 text-rose-500' : 'border-border text-foreground'}`}><Heart className={isWishlisted ? 'fill-current' : ''} /> {isWishlisted ? 'Saved' : 'Add to wishlist'}</button></div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-border/70 py-5 text-center text-[10px] text-muted-foreground sm:grid-cols-4"><div><Truck className="mx-auto mb-2 size-5 text-primary" />Worldwide sourcing</div><div><ShieldCheck className="mx-auto mb-2 size-5 text-primary" />Secure payments</div><div><Box className="mx-auto mb-2 size-5 text-primary" />White glove delivery</div><div><Headphones className="mx-auto mb-2 size-5 text-primary" />Dedicated support</div></div>
      </section>
    </div>

    <section className="border-t border-border/70">
      <nav className="sticky top-16 z-20 -mx-1 overflow-x-auto border-b border-border/70 bg-canvas/95 px-1 backdrop-blur" aria-label="Product information"><div className="flex min-w-max gap-7">{tabItems.map((tab) => <button type="button" key={tab.id} onClick={() => changeTab(tab.id)} className={`min-h-14 border-b-2 px-1 text-xs transition-colors ${activeTab === tab.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>)}</div></nav>
      <div className="pt-10">
        {activeTab === 'details' && <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">A closer look</p><h2 className="mt-3 max-w-md font-serif text-4xl font-light leading-[0.95] sm:text-5xl">Thoughtful details. Lasting quality.</h2><p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">{product?.longDescription || product?.description || 'A carefully selected piece made with considered proportions, material, and character.'}</p><div className="mt-8 border border-border/70 bg-muted/40 p-6 text-center"><Sparkle className="mx-auto size-6 text-primary" /><p className="mt-3 font-serif text-2xl font-light">Sustainably considered</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Crafted with care using premium materials and responsible sourcing practices.</p></div></div><div className="grid grid-cols-2 gap-3">{gallery.slice(1, 5).map((image, index) => <div key={`${image}-${index}`} className={`relative overflow-hidden bg-muted ${index === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}><Image src={image} alt={`${product?.name || 'Product'} detail ${index + 1}`} fill sizes="(max-width: 1023px) 50vw, 35vw" className="object-cover" /></div>)}</div></div>}
        {activeTab === 'dimensions' && <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14"><div className="relative aspect-[4/3] overflow-hidden bg-muted">{gallery[1] && <Image src={gallery[1]} alt={`${product?.name || 'Product'} dimensions`} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />}<div className="absolute left-5 top-5 inline-flex items-center gap-2 bg-background/90 px-3 py-2 text-xs"><Ruler className="size-4 text-primary" /> Dimensions</div></div><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Made to fit</p><h2 className="mt-3 font-serif text-4xl font-light">Dimensions</h2><div className="mt-7 divide-y divide-border/70 border-y border-border/70">{dimensions.length > 0 ? dimensions.map((item: any) => <div key={item.key} className="flex items-center justify-between gap-6 py-4 text-sm"><span className="text-muted-foreground">{item.label}</span><span className="text-foreground">{item.value}{item.unit ? ` ${item.unit}` : ''}</span></div>) : <p className="py-5 text-sm leading-6 text-muted-foreground">Dimensions will be confirmed with the studio.</p>}</div></div></div>}
        {activeTab === 'materials' && <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Materials & care</p><h2 className="mt-3 font-serif text-4xl font-light">Made to be lived with.</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">{product?.material || 'Material, finish, and care guidance are confirmed for the selected configuration.'}</p></div><div className="divide-y divide-border/70 border-y border-border/70">{[['Upholstery', selectedFabric?.label || selectedFabric?.name || 'Confirmed with your selection'], ['Material', selectedMaterial?.label || selectedMaterial?.name || product?.material || 'Selected for the piece'], ['Finish', selectedFinish?.label || selectedFinish?.name || 'Confirmed with the studio'], ['Care', product?.careInstructions || 'Vacuum regularly. Spot clean with a mild, fibre-safe solvent. Professional cleaning recommended.']].map(([label, value]) => <div key={label} className="grid gap-2 py-4 text-sm sm:grid-cols-[9rem_1fr]"><span className="text-muted-foreground">{label}</span><span className="text-foreground">{value}</span></div>)}</div></div>}
        {activeTab === 'shipping' && <div className="grid gap-4 sm:grid-cols-3"><div className="border border-border/70 p-6"><Truck className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">Shipping information</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Delivery timing and installation are confirmed for your location before fulfilment.</p></div><div className="border border-border/70 p-6"><Box className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">White glove delivery</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Our team can coordinate careful delivery and placement for considered pieces.</p></div><div className="border border-border/70 p-6"><ShieldCheck className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">Returns & exchanges</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Review the returns policy or contact the studio before ordering if you need guidance.</p></div></div>}
      </div>
    </section>
    <ProductShareSheet product={{ name: product?.name || '', price: totalPrice, currency, image: selectedImage, description: product?.description }} open={shareOpen} onOpenChange={setShareOpen} />
  </div>
}

function OptionGroup({ label, options, selected, onSelect, currency, getImage }: { label: string; options: any[]; selected: any; onSelect: (value: any) => void; currency: string; getImage?: (option: any) => string | null }) {
  return <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground">{label}: <span className="text-primary">{selected?.label || selected?.name || 'Select'}</span></p><div className="flex flex-wrap gap-2">{options.map((option, index) => { const image = getImage?.(option); return <button type="button" key={option?.id || index} onClick={() => onSelect(option)} className={`inline-flex min-h-10 items-center gap-2 border px-3 text-xs transition-colors ${selected?.id === option?.id ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'}`}>{image ? <span className="relative size-8 shrink-0 overflow-hidden border border-border/70 bg-muted"><Image src={image} alt="" fill sizes="32px" className="object-cover" /></span> : label.toLowerCase().includes('colour') ? <span className="inline-block size-3 rounded-full border border-border/70" style={{ backgroundColor: option?.value || '#d4d0c8' }} /> : null}<span>{option?.label || option?.name || 'Option'}{optionPriceForDisplay(option) > 0 ? ` (+${formatMoney(optionPriceForDisplay(option), currency)})` : ''}</span></button> })}</div></div>
}

function optionPriceForDisplay(option: any) { return Number(option?.priceDelta ?? option?.price ?? 0) || 0 }
