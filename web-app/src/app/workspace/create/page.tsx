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
    name: ''
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

      console.log('Auth check:', { user: user?.id, userError })

      if (userError || !user) {
        console.error('User auth error:', userError)
        toast.error('You must be logged in to create a workspace')
        router.push('/login')
        return
      }

      // Generate slug from workspace name
      const slug = formData.name.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

      console.log('Calling create_workspace_with_owner function:', {
        name: formData.name.trim(),
        slug,
        owner_id: user.id
      })

      // Use the database function that handles both workspace creation and membership
      // This function runs with SECURITY DEFINER, bypassing RLS restrictions
      const { data: workspaceId, error: workspaceError } = await supabase
        .rpc('create_workspace_with_owner', {
          workspace_name: formData.name.trim(),
          workspace_slug: slug,
          owner_user_id: user.id
        } as any)

      if (workspaceError) {
        console.error('Full workspace error:', {
          message: workspaceError.message,
          details: workspaceError.details,
          hint: workspaceError.hint,
          code: workspaceError.code,
          fullError: workspaceError
        })
        toast.error(`Failed to create workspace: ${workspaceError.message || 'Unknown error'}`)
        return
      }

      console.log('Workspace created with ID:', workspaceId)

      toast.success('Workspace created successfully!')

      // Store new workspace in localStorage and redirect
      localStorage.setItem('currentWorkspaceId', workspaceId)
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
          <li>• You&apos;ll be added as an Admin with full permissions</li>
          <li>• You can invite team members and assign roles</li>
          <li>• All workspace data will be isolated and secure</li>
          <li>• You can switch between workspaces anytime</li>
        </ul>
      </div>
    </div>
  )
}
