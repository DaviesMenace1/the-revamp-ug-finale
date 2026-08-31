'use client'

import { useEffect, useState } from 'react'
import { Check, MapPin, Pencil, Plus, Save, Trash2, X } from '@/components/ui/luxury-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type SavedAddress = {
  id: string
  label: string
  recipientName: string
  phone: string
  address: string
  city: string
  region: string | null
  country: string
  notes: string | null
  isDefault: boolean
}

type AddressForm = Omit<SavedAddress, 'id' | 'isDefault'>

const EMPTY_FORM: AddressForm = {
  label: 'Home',
  recipientName: '',
  phone: '',
  address: '',
  city: '',
  region: '',
  country: 'Uganda',
  notes: '',
}

export function SavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/account/addresses', { cache: 'no-store' })
      const payload = await response.json().catch(() => null) as { addresses?: SavedAddress[]; error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'We could not load your saved addresses.')
      setAddresses(Array.isArray(payload?.addresses) ? payload.addresses : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load your saved addresses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const update = (key: keyof AddressForm, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const reset = () => { setForm(EMPTY_FORM); setEditingId(null); setError(null) }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(editingId ? `/api/account/addresses/${editingId}` : '/api/account/addresses', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isDefault: addresses.length === 0 || !editingId && addresses.length === 0 }),
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'We could not save this address.')
      setMessage(editingId ? 'Address updated.' : 'Address saved.')
      reset()
      await load()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'We could not save this address.')
    } finally {
      setSaving(false)
    }
  }

  const makeDefault = async (address: SavedAddress) => {
    setError(null)
    setMessage(null)
    const response = await fetch(`/api/account/addresses/${address.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
    const payload = await response.json().catch(() => null) as { error?: string } | null
    if (!response.ok) { setError(payload?.error || 'We could not set the default address.'); return }
    setMessage('Default address updated.')
    await load()
  }

  const remove = async (address: SavedAddress) => {
    if (!window.confirm(`Remove ${address.label}?`)) return
    setError(null)
    setMessage(null)
    const response = await fetch(`/api/account/addresses/${address.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => null) as { error?: string } | null
    if (!response.ok) { setError(payload?.error || 'We could not remove this address.'); return }
    setMessage('Address removed.')
    await load()
  }

  return (
    <section className="mt-8 rounded-xl border border-border/70 bg-card p-5 shadow-lift sm:p-7">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Checkout convenience</p><h2 className="mt-2 font-serif text-3xl">Saved addresses</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep delivery details ready for your next order. You can edit or remove them at any time.</p></div>
        <MapPin className="size-5 text-primary" aria-hidden="true" />
      </div>
      {(message || error) && <p role={error ? 'alert' : 'status'} className={`mt-5 rounded-md border px-3 py-2 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'}`}>{error || message}</p>}
      {loading ? <p className="mt-5 text-sm text-muted-foreground">Loading saved addresses…</p> : <div className="mt-5 space-y-3">{addresses.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No saved addresses yet.</p> : addresses.map((address) => <div key={address.id} className="flex flex-col gap-4 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="font-medium">{address.label}{address.isDefault && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-primary">Default</span>}</p><p className="mt-1 text-sm text-muted-foreground">{address.recipientName} · {address.phone}</p><p className="mt-1 text-sm text-muted-foreground">{address.address}, {address.city}{address.region ? ` · ${address.region}` : ''}, {address.country}</p></div></div><div className="flex flex-wrap gap-2 sm:justify-end"><Button type="button" variant="outline" size="sm" onClick={() => makeDefault(address)} disabled={saving || address.isDefault}><Check className="mr-2 size-3.5" aria-hidden="true" /> Default</Button><Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(address.id); setForm({ label: address.label, recipientName: address.recipientName, phone: address.phone, address: address.address, city: address.city, region: address.region || '', country: address.country, notes: address.notes || '' }); setError(null); setMessage(null) }}><Pencil className="mr-2 size-3.5" aria-hidden="true" /> Edit</Button><Button type="button" variant="outline" size="sm" onClick={() => void remove(address)} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 size-3.5" aria-hidden="true" /> Remove</Button></div></div>)}</div>}
      <form onSubmit={save} className="mt-6 rounded-lg border border-border/70 bg-muted/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-medium">{editingId ? 'Edit address' : 'Add an address'}</h3><p className="mt-1 text-xs text-muted-foreground">Use a clear label such as Home, Office, or Studio.</p></div>{editingId && <Button type="button" variant="ghost" size="sm" onClick={reset}><X className="mr-2 size-4" aria-hidden="true" /> Cancel</Button>}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {([['label', 'Label', 'Home'], ['recipientName', 'Recipient name', 'Full name'], ['phone', 'Phone', '+256 700 000000'], ['address', 'Street address', 'Plot / Street / Address'], ['city', 'City', 'Kampala'], ['region', 'Area / neighborhood', 'Kyanja'], ['country', 'Country', 'Uganda']] as const).map(([key, label, placeholder]) => <div key={key}><label className="mb-2 block text-sm font-medium" htmlFor={`saved-address-${key}`}>{label}</label><Input id={`saved-address-${key}`} value={form[key] || ''} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} required={['label', 'recipientName', 'phone', 'address', 'city', 'country'].includes(key)} className="min-h-11 border-muted" /></div>)}
          <div className="sm:col-span-2"><label className="mb-2 block text-sm font-medium" htmlFor="saved-address-notes">Delivery notes <span className="font-normal text-muted-foreground">(optional)</span></label><Textarea id="saved-address-notes" value={form.notes || ''} onChange={(event) => update('notes', event.target.value)} rows={3} className="resize-none border-muted" /></div>
        </div>
        <Button type="submit" disabled={saving} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">{editingId ? <Save className="mr-2 size-4" aria-hidden="true" /> : <Plus className="mr-2 size-4" aria-hidden="true" />}{saving ? 'Saving…' : editingId ? 'Save address' : 'Add address'}</Button>
      </form>
    </section>
  )
}
