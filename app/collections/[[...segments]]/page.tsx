import CollectionsLanding from '@/components/collections/collections-landing'
import CollectionsSegmentPage from '@/components/collections/collections-segment-page'

export const dynamic = 'force-dynamic'

export default async function CollectionsRoute({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params
  if (segments.length === 0) return <CollectionsLanding />
  return <CollectionsSegmentPage params={Promise.resolve({ segments })} />
}
