'use client'

import { useState, useEffect } from 'react'
import { Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/auth-context'
import { getWorkspaceSettings, updateWorkspaceSettings, getEnrichmentUsage } from '@/services/workspace-settings'
import type { WorkspaceSettings, EnrichmentUsage } from '@/types/workspace-settings'

export default function ApiSettingsPage() {
  const { workspace } = useAuth()

  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [usage, setUsage] = useState<EnrichmentUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  // Form state
  const [apiKey, setApiKey] = useState('')
  const [autoEnrich, setAutoEnrich] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    if (workspace?.id) {
      loadData()
    }
  }, [workspace?.id])

  async function loadData() {
    if (!workspace?.id) return

    try {
      setLoading(true)
      const [settingsData, usageData] = await Promise.all([
        getWorkspaceSettings(workspace.id),
        getEnrichmentUsage(workspace.id, 30),
      ])
      setSettings(settingsData)
      setAutoEnrich(settingsData.apollo_auto_enrich)

      setUsage(usageData)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveApiKey() {
    if (!workspace?.id || !apiKey) return

    try {
      setSaving(true)
      setTestResult(null)

      const response = await fetch(`/api/workspace/settings/apollo-key?workspace_id=${workspace.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, workspace_id: workspace.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to save API key')
      }

      await loadData()
      setApiKey('')
      setTestResult({
        success: true,
        message: 'API key saved successfully',
      })
    } catch (err) {
      console.error('Failed to save API key:', err)
      setTestResult({
        success: false,
        message: 'Failed to save API key',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveApiKey() {
    if (!workspace?.id) return
    if (!confirm('Are you sure you want to remove the Apollo API key?')) return

    try {
      setSaving(true)
      setTestResult(null)

      const response = await fetch(`/api/workspace/settings/apollo-key?workspace_id=${workspace.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove API key')
      }

      await loadData()
      setTestResult({
        success: true,
        message: 'API key removed successfully',
      })
    } catch (err) {
      console.error('Failed to remove API key:', err)
      setTestResult({
        success: false,
        message: 'Failed to remove API key',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    if (!workspace?.id) return

    try {
      setTesting(true)
      setTestResult(null)

      const response = await fetch(`/api/workspace/settings/test-apollo?workspace_id=${workspace.id}`)

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `Connection successful! Credits remaining: ${data.credits_remaining || 'Unknown'}`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error_message || 'Connection failed',
        })
      }
    } catch (err) {
      console.error('Failed to test connection:', err)
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleToggleAutoEnrich(enabled: boolean) {
    if (!workspace?.id) return

    try {
      setSaving(true)
      await updateWorkspaceSettings(workspace.id, {
        apollo_auto_enrich: enabled,
      })
      setAutoEnrich(enabled)
      await loadData()
    } catch (err) {
      console.error('Failed to update auto-enrich:', err)
      alert('Failed to update auto-enrich setting')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          <div>
          <h1 className="text-2xl font-bold">API Settings</h1>
          <p className="text-sm text-gray-500">Manage third-party API integrations</p>
        </div>

        {/* Apollo.io Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Apollo.io API Key</span>
                </CardTitle>
                <CardDescription>
                  Configure your Apollo.io API key for account and contact enrichment
                </CardDescription>
              </div>
              {settings?.apollo_api_key_configured && (
                <Badge variant="default">Configured</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={
                      settings?.apollo_api_key_configured
                        ? '••••••••••••••••••••'
                        : 'Enter your Apollo.io API key'
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleSaveApiKey} disabled={!apiKey || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Your API key is encrypted and stored securely. Get your key from{' '}
                <a
                  href="https://app.apollo.io/#/settings/integrations/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Apollo.io Settings
                </a>
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg ${
                  testResult.success
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={handleTestConnection}
                disabled={!settings?.apollo_api_key_configured || testing}
                variant="outline"
              >
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test Connection
              </Button>
              {settings?.apollo_api_key_configured && (
                <Button onClick={handleRemoveApiKey} disabled={saving} variant="destructive">
                  Remove Key
                </Button>
              )}
            </div>

            {/* Auto-Enrich Toggle */}
            {settings?.apollo_api_key_configured && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-enrich">Auto-Enrich New Records</Label>
                    <p className="text-sm text-gray-500">
                      Automatically enrich new accounts and contacts when they are created
                    </p>
                  </div>
                  <Switch
                    id="auto-enrich"
                    checked={autoEnrich}
                    onCheckedChange={handleToggleAutoEnrich}
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrichment Usage Stats */}
        {settings?.apollo_api_key_configured && usage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Enrichment Usage</span>
              </CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Credits</p>
                  <p className="text-2xl font-bold">{usage.credits_used}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Accounts Enriched</p>
                  <p className="text-2xl font-bold">{usage.accounts_enriched}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contacts Enriched</p>
                  <p className="text-2xl font-bold">{usage.contacts_enriched}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Daily Average</p>
                  <p className="text-2xl font-bold">{usage.daily_average}</p>
                </div>
              </div>

              {/* Simple bar chart */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Daily Usage</p>
                <div className="flex items-end space-x-1 h-32">
                  {usage.last_30_days.slice(-14).map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{
                          height: `${
                            usage.daily_average > 0
                              ? (day.credits / (usage.daily_average * 2)) * 100
                              : 0
                          }%`,
                          minHeight: day.credits > 0 ? '4px' : '0px',
                        }}
                        title={`${day.date}: ${day.credits} credits`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Last 14 days</span>
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other API Integrations (Placeholder) */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-gray-400">Other Integrations</CardTitle>
            <CardDescription>More API integrations coming soon</CardDescription>
          </CardHeader>
        </Card>
        </div>
      </div>
    </AppShell>
  )
}
