'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/lib/auth/auth-context'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type WorkspaceSettingsForm = {
  name: string
  slug: string
}

export default function SettingsPage() {
  const { workspace, role, user, loading, signOut, refreshWorkspace } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
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

    // Check confirmation text
    const expectedText = workspace.name
    if (deleteConfirmText !== expectedText) {
      toast.error(`Please type "${expectedText}" to confirm deletion`)
      return
    }

    setDeleting(true)

    try {
      // Perform a HARD delete - this will cascade delete all related data
      // Thanks to ON DELETE CASCADE foreign keys in the schema
      const result: any = await (supabase as any)
        .from('workspaces')
        .delete()
        .eq('id', workspace.id)

      if (result.error) {
        console.error('Delete error:', result.error)
        throw result.error
      }

      toast.success('Workspace deleted successfully')

      // Sign out and redirect to login
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Error deleting workspace:', err)

      // Provide helpful error messages
      if (err instanceof Error) {
        if (err.message.includes('permission denied') || err.message.includes('policy')) {
          toast.error('You do not have permission to delete this workspace. Only workspace owners and admins can delete workspaces.')
        } else {
          toast.error(`Failed to delete workspace: ${err.message}`)
        }
      } else {
        toast.error('Failed to delete workspace. Please try again.')
      }
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setDeleteConfirmText('')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!workspace || !user) {
    router.push('/workspace')
    return null
  }

  if (role !== 'admin') {
    return (
      <AppShell>
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
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">

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
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete Workspace'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will permanently delete the workspace <strong>{workspace.name}</strong> and all associated data including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All members and invitations</li>
                <li>All accounts and contacts</li>
                <li>All activities and tasks</li>
                <li>All settings and configurations</li>
                <li>All jobs and history</li>
              </ul>
              <p className="font-semibold text-red-600 pt-2">
                This action cannot be undone.
              </p>
              <div className="pt-2">
                <Label htmlFor="delete-confirm">
                  Type <strong>{workspace.name}</strong> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={workspace.name}
                  className="mt-2"
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmText('')
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={deleteConfirmText !== workspace.name || deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
