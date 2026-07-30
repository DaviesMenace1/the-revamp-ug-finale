import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="space-y-8 p-8 max-w-4xl">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure system settings and preferences</p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Name</label>
              <Input value="The Revamp UG" className="rounded-none border-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Email</label>
              <Input value="hello@revampug.com" className="rounded-none border-muted" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
              <Input value="+256 (0) 700 000 000" className="rounded-none border-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Address</label>
              <Input value="Plot 12, Industrial Area, Kampala, Uganda" className="rounded-none border-muted" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Business Description</label>
            <Textarea
              value="We are a premier interior design and architecture studio based in Kampala, Uganda."
              rows={4}
              className="rounded-none border-muted resize-none"
            />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure email notifications and templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-foreground">Send order confirmation emails</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-foreground">Send project update emails to clients</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-foreground">Send new message notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-foreground">Send weekly summary reports</span>
            </label>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
            <Save className="w-4 h-4 mr-2" />
            Save Email Settings
          </Button>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure payment methods and options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
              <select className="w-full px-3 py-2 border border-muted rounded-none text-foreground bg-background">
                <option>UGX (Uganda Shilling)</option>
                <option>USD (US Dollar)</option>
                <option>EUR (Euro)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tax Rate (%)</label>
              <Input value="18" className="rounded-none border-muted" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-foreground">Enable bank transfer payments</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-foreground">Enable card payments</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-foreground">Enable mobile money payments</span>
            </label>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
            <Save className="w-4 h-4 mr-2" />
            Save Payment Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
