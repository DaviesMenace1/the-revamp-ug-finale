import { getProjects } from '@/lib/db/queries'
import ProjectsClient from './projects-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function AdminProjectsPage() {
  // Fetch all projects to display in the admin dashboard
  const result = await safeQuery(getProjects(100, 0), 'admin projects', [])

  return <ProjectsClient initialProjects={result.data} loadError={result.error ? 'Projects are temporarily unavailable. You can retry the page.' : null} />
}
