import { getProjects } from '@/lib/db/queries'
import ProjectsClient from './projects-client'

export const dynamic = 'force-dynamic'

export default async function AdminProjectsPage() {
  // Fetch all projects to display in the admin dashboard
  const projects = await getProjects(100, 0)
  
  return <ProjectsClient initialProjects={projects} />
}
