import { getSetting } from '@/lib/actions/settings'
import AboutClient from './about-client'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/about-content'

export default async function AdminAboutPage() {
  const about = await getSetting<AboutContent>('aboutPage', DEFAULT_ABOUT)
  return <AboutClient initial={about} />
}
