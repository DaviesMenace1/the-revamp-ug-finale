import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const projects = [
  { id: 1, name: 'The Nakasero Residence', client: 'Sarah Kiwanuka', status: 'In Progress', progress: 65, dueDate: '2026-09-15' },
  { id: 2, name: 'Kololo Villa Renovation', client: 'James Mutua', status: 'In Progress', progress: 45, dueDate: '2026-10-30' },
  { id: 3, name: 'Serena Penthouse Suite', client: 'Hotel Management', status: 'Completed', progress: 100, dueDate: '2026-08-20' },
  { id: 4, name: 'Muyenga Heritage Home', client: 'Family Trust', status: 'On Hold', progress: 30, dueDate: '2026-11-10' },
  { id: 5, name: 'Pearl Marina Corporate HQ', client: 'Corporate Client', status: 'In Progress', progress: 75, dueDate: '2026-09-30' },
]

export default function AdminProjects() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage client projects and timelines</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>{projects.length} projects total</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-10 rounded-none border-muted" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/20">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Project Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Progress</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm text-foreground font-medium">{project.name}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{project.client}</td>
                    <td className="py-4 px-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : project.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{project.dueDate}</td>
                    <td className="py-4 px-4 text-sm flex gap-2">
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
