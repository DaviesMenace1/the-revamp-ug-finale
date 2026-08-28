import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EditorialHomepage } from '@/components/sections/editorial-homepage'

export const revalidate = 60

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <EditorialHomepage />
      </main>
      <SiteFooter />
    </>
  )
}
