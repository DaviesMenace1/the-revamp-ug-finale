'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Headphones, Mail, MessageCircle, Ticket, X } from '@/components/ui/luxury-icons'
import { FaInstagram, FaWhatsapp } from '@/components/ui/luxury-icons'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { CustomSignIn, CustomSignUp } from '@/components/auth/custom-auth-forms'

const WHATSAPP_URL = 'https://wa.me/256703861668?text=Hello%20The%20Revamp%20UG%2C%20I%20would%20like%20some%20help.'
const INSTAGRAM_URL = 'https://www.instagram.com/therevamp_ug'
const EMAIL_URL = 'mailto:support@therevampug.com?subject=Support%20from%20The%20Revamp%20UG'

type SupportCard = 'tickets' | 'messages' | null

type FloatingActionProps = {
  label: string
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  tone?: 'default' | 'whatsapp' | 'instagram'
}

export function FloatingUtilities() {
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportCard, setSupportCard] = useState<SupportCard>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in')

  useEffect(() => {
    const openAuth = () => {
      setAuthMode('sign-in')
      setAuthOpen(true)
      setSupportOpen(false)
      setSupportCard(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (authOpen) setAuthOpen(false)
      else if (supportOpen) {
        setSupportOpen(false)
        setSupportCard(null)
      }
    }
    window.addEventListener('revamp:open-auth', openAuth)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('revamp:open-auth', openAuth)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [authOpen, supportOpen])

  useEffect(() => {
    if (!supportOpen && !authOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [supportOpen, authOpen])

  const toggleSupport = () => {
    setSupportOpen((open) => !open)
    setSupportCard(null)
  }

  const openSupportCard = (card: Exclude<SupportCard, null>) => {
    setSupportOpen(true)
    setSupportCard(card)
  }

  const closeAuth = () => setAuthOpen(false)
  const ticketHref = '/client/tickets'
  const messageHref = '/client/messages'

  return (
    <>
      {supportOpen && <button type="button" aria-label="Close support overlay" className="fixed inset-0 z-[60] cursor-default bg-background/45 backdrop-blur-sm" onClick={() => { setSupportOpen(false); setSupportCard(null) }} />}

      {supportOpen && <div className="fixed bottom-[5.75rem] right-4 z-[65] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 sm:right-6" role="dialog" aria-label="Contact and support options">
        {supportCard && <SupportCardPanel type={supportCard} href={supportCard === 'tickets' ? ticketHref : messageHref} onClose={() => setSupportCard(null)} />}
        <div className="flex flex-col gap-2">
          <FloatingAction label="WhatsApp" href={WHATSAPP_URL} icon={<FaWhatsapp className="size-5" aria-hidden="true" />} tone="whatsapp" />
          <FloatingAction label="Instagram" href={INSTAGRAM_URL} icon={<FaInstagram className="size-5" aria-hidden="true" />} tone="instagram" />
          <FloatingAction label="Email support" href={EMAIL_URL} icon={<Mail className="size-5" aria-hidden="true" />} />
          <FloatingAction label="Support tickets" onClick={() => openSupportCard('tickets')} icon={<Ticket className="size-5" aria-hidden="true" />} />
          <FloatingAction label="Client messages" onClick={() => openSupportCard('messages')} icon={<MessageCircle className="size-5" aria-hidden="true" />} />
        </div>
      </div>}

      <div className="fixed right-4 top-[5.75rem] z-[55] sm:right-6"><ThemeSwitcher /></div>
      <button type="button" onClick={toggleSupport} aria-label={supportOpen ? 'Close support and contact options' : 'Open support and contact options'} aria-expanded={supportOpen} className="fixed bottom-4 right-4 z-[70] flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-[0_14px_35px_rgba(0,0,0,0.22)] ring-1 ring-background/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:right-6 sm:size-14"><span className="transition-transform duration-200">{supportOpen ? <X className="size-5" aria-hidden="true" /> : <Headphones className="size-5" aria-hidden="true" />}</span></button>

      {authOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-foreground/35 p-4 backdrop-blur-md sm:items-center sm:p-8" role="dialog" aria-modal="true" aria-label={authMode === 'sign-in' ? 'Sign in to your account' : 'Create an account'} onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuth() }}><div className="relative w-full max-w-md"><button type="button" onClick={closeAuth} aria-label="Close account access" className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"><X className="size-4" aria-hidden="true" /></button>{authMode === 'sign-in' ? <CustomSignIn redirectUrl="/account" /> : <CustomSignUp redirectUrl="/account" />}<div className="mt-3 text-center text-xs text-background/80"><button type="button" onClick={() => setAuthMode((mode) => mode === 'sign-in' ? 'sign-up' : 'sign-in')} className="underline underline-offset-4">{authMode === 'sign-in' ? 'New to The Revamp? Create an account' : 'Already a member? Sign in'}</button></div></div></div>}
    </>
  )
}

function FloatingAction({ label, href, onClick, icon, tone = 'default' }: FloatingActionProps) {
  const className = `flex min-h-12 w-full items-center gap-3 rounded-full border bg-background/95 px-4 text-left text-xs uppercase tracking-[0.14em] text-foreground shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-0.5 ${tone === 'whatsapp' ? 'border-[#25D366]/40' : tone === 'instagram' ? 'border-[#C13584]/40' : 'border-border/80'}`
  const content = <><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone === 'whatsapp' ? 'bg-[#25D366] text-white' : tone === 'instagram' ? 'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#FCAF45] text-white' : 'bg-foreground text-background'}`}>{icon}</span><span className="min-w-0 flex-1 truncate">{label}</span><span className="text-[10px] text-muted-foreground">{href ? 'Open' : 'View'}</span></>
  if (href) return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className={className}>{content}</a>
  return <button type="button" onClick={onClick} className={className}>{content}</button>
}

function SupportCardPanel({ type, href, onClose }: { type: Exclude<SupportCard, null>; href: string; onClose: () => void }) {
  const isTickets = type === 'tickets'
  return <section className="animate-in slide-in-from-bottom-2 rounded-2xl border border-border/80 bg-background/95 p-5 text-foreground shadow-2xl backdrop-blur-xl duration-200" aria-labelledby={`floating-${type}-title`}><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Private client care</p><h2 id={`floating-${type}-title`} className="mt-2 font-serif text-2xl font-light">{isTickets ? 'Support tickets' : 'Client messages'}</h2></div><button type="button" onClick={onClose} aria-label="Close support card" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"><X className="size-4" aria-hidden="true" /></button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{isTickets ? 'Keep a clear record of requests, resolutions and the details our team is already holding for you.' : 'Continue a private conversation with the studio from wherever you are.'}</p><Link href={href} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 text-xs font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:bg-primary">{isTickets ? 'Open support tickets' : 'Open client messages'} <span aria-hidden="true">→</span></Link></section>
}
