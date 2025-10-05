'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Workspace name is required')
      return
    }

    setLoading(true)

    try {
      const supabase = createClientRaw()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('You must be logged in to create a workspace')
        router.push('/login')
        return
      }

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          created_by: user.id
        })
        .select()
        .single()

      if (workspaceError) {
        console.error('Error creating workspace:', workspaceError)
        toast.error('Failed to create workspace')
        return
      }

      // Add current user as Admin
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        toast.error('Workspace created but failed to add you as admin')
        return
      }

      toast.success('Workspace created successfully!')

      // Store new workspace in localStorage and redirect
      localStorage.setItem('currentWorkspaceId', workspace.id)
      router.push('/workspace')
      router.refresh()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <Link href="/workspace">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Workspace</CardTitle>
          <CardDescription>
            Create a workspace for your team to collaborate on accounts and sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Corp Sales Team"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be visible to all team members
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Enterprise sales team workspace"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Add a description to help identify this workspace
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workspace
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• You'll be added as an Admin with full permissions</li>
          <li>• You can invite team members and assign roles</li>
          <li>• All workspace data will be isolated and secure</li>
          <li>• You can switch between workspaces anytime</li>
        </ul>
      </div>
    </div>
  )
}
