import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Search, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'

const consultations = [
  { id: '#CONS-1847', client: 'John Doe', project: 'Residential Redesign', status: 'Scheduled', date: '2026-08-25 10:00 AM' },
  { id: '#CONS-1846', client: 'Alice Smith', project: 'Office Renovation', status: 'Completed', date: '2026-08-20 2:00 PM' },
  { id: '#CONS-1845', client: 'Michael Brown', project: 'Luxury Apartment', status: 'Pending', date: '2026-08-28 3:00 PM' },
  { id: '#CONS-1844', client: 'Sarah Johnson', project: 'Commercial Space', status: 'Scheduled', date: '2026-08-26 11:00 AM' },
  { id: '#CONS-1843', client: 'David Wilson', project: 'Villa Design', status: 'Cancelled', date: '2026-08-22 4:00 PM' },
]

export default function AdminConsultations() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Consultations</h1>
          <p className="text-muted-foreground mt-2">Manage client consultation bookings</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Consultation
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Consultations</CardTitle>
              <CardDescription>{consultations.length} consultations total</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search consultations..." className="pl-10 rounded-none border-muted" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/20">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Consultation ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Project Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map(consultation => (
                  <tr key={consultation.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm font-mono text-foreground">{consultation.id}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{consultation.client}</td>
                    <td className="py-4 px-4 text-sm text-foreground">{consultation.project}</td>
                    <td className="py-4 px-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          consultation.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : consultation.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : consultation.status === 'Pending'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {consultation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {consultation.date}
                      </div>
                    </td>
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
