import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PrototypeHomepage } from '@/components/sections/prototype-homepage'

export const revalidate = 60

export default function HomePage() {
  return <><SiteHeader /><main><PrototypeHomepage /></main><SiteFooter /></>
}
