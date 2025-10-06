'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/lib/auth/auth-context'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import { ArrowLeft, LogOut, AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type WorkspaceSettingsForm = {
  name: string
  slug: string
}

export default function SettingsPage() {
  const { workspace, role, user, loading, signOut, refreshWorkspace } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClientRaw()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WorkspaceSettingsForm>()

  useEffect(() => {
    if (workspace) {
      setValue('name', workspace.name)
      setValue('slug', workspace.slug)
    }
  }, [workspace, setValue])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const onSubmit = async (data: WorkspaceSettingsForm) => {
    if (!workspace) return

    setSaving(true)
    setError(null)

    try {
      // Use type assertion to bypass strict Supabase type checking
      const result: any = await (supabase as any)
        .from('workspaces')
        .update({
          name: data.name,
          slug: data.slug,
        })
        .eq('id', workspace.id)

      if (result.error) throw result.error

      toast.success('Workspace settings updated')
      await refreshWorkspace()
    } catch (err) {
      console.error('Error updating workspace:', err)
      setError(err instanceof Error ? err.message : 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspace) return

    const confirmText = `Delete ${workspace.name}`
    const userInput = prompt(
      `Are you sure you want to delete this workspace? This action cannot be undone.\n\nType "${confirmText}" to confirm:`
    )

    if (userInput !== confirmText) {
      return
    }

    try {
      // Use type assertion to bypass strict Supabase type checking
      const result: any = await (supabase as any)
        .from('workspaces')
        .update({ status: 'deleted' })
        .eq('id', workspace.id)

      if (result.error) throw result.error

      toast.success('Workspace deleted')
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Error deleting workspace:', err)
      toast.error('Failed to delete workspace')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!workspace || !user) {
    router.push('/workspace')
    return null
  }

  if (role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only workspace administrators can access settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/workspace')} className="w-full">
              Back to Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Adaptive Outbound</h1>
            <WorkspaceSwitcher />
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/workspace')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspace
          </Button>
          <h2 className="text-3xl font-bold">Workspace Settings</h2>
          <p className="text-muted-foreground">Manage your workspace configuration</p>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your workspace details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    disabled={saving}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Workspace Slug</Label>
                  <Input
                    id="slug"
                    {...register('slug', { required: 'Slug is required' })}
                    disabled={saving}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-500">{errors.slug.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Used in URLs and API endpoints
                  </p>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your entire workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Delete Workspace</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Permanently delete this workspace and all associated data. This action
                    cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteWorkspace}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Workspace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
