import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PrototypeServices } from '@/components/sections/prototype-services'

export const metadata = { title: 'Services — The Revamp UG', description: 'End-to-end concierge for luxury interiors and architecture: sourcing, importing, white-glove installation, styling and architectural services for residences in Uganda.' }

export default function ServicesPage() { return <><SiteHeader /><main><PrototypeServices /></main><SiteFooter /></> }
