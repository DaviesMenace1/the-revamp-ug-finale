import CollectionsLanding from '@/components/collections/collections-landing'
import CollectionsSegmentPage from '@/components/collections/collections-segment-page'

export const dynamic = 'force-dynamic'

export default async function CollectionsRoute({ params, searchParams }: { params: Promise<{ segments?: string[] }>; searchParams: Promise<{ trade?: string }> }) {
  const { segments = [] } = await params
  if (segments.length === 0) return <CollectionsLanding />
  const { trade } = await searchParams
  return <CollectionsSegmentPage params={Promise.resolve({ segments })} tradeContext={trade === '1'} />
}
