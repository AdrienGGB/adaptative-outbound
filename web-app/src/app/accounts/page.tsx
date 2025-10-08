"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getAccounts, searchAccounts } from "@/services"
import type { Account, AccountFilters } from "@/types"
import { AccountsTable } from "@/components/accounts/accounts-table"
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, Building2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export default function AccountsPage() {
  const { workspace, loading: authLoading } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !workspace) {
      router.push("/login")
    }
  }, [authLoading, workspace, router])

  // Fetch accounts
  useEffect(() => {
    if (!workspace) return

    const fetchAccounts = async () => {
      setLoading(true)
      try {
        const filters: AccountFilters = {
          workspace_id: workspace.id,
        }

        // Add filters if set
        if (statusFilter !== "all") {
          filters.status = statusFilter as any
        }
        if (lifecycleFilter !== "all") {
          filters.lifecycle_stage = lifecycleFilter as any
        }
        if (tierFilter !== "all") {
          filters.account_tier = tierFilter as any
        }

        let data: Account[]
        if (searchQuery.trim()) {
          // Use search if query exists
          data = await searchAccounts(workspace.id, searchQuery)
        } else {
          // Otherwise get all with filters
          data = await getAccounts(filters)
        }

        setAccounts(data)
      } catch (error) {
        console.error("Failed to fetch accounts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [workspace, searchQuery, statusFilter, lifecycleFilter, tierFilter])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/workspace")}
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Accounts
                </h1>
                <p className="text-sm text-muted-foreground">
                  {workspace.name}
                </p>
              </div>
            </div>
            <CreateAccountDialog workspaceId={workspace.id} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search accounts by name, domain, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Button - Mobile */}
            <Button variant="outline" className="md:hidden">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filters - Desktop */}
          <div className="hidden md:flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="merged">Merged</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={lifecycleFilter}
              onValueChange={setLifecycleFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lifecycle Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="target">Target</SelectItem>
                <SelectItem value="engaged">Engaged</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Account Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="mid-market">Mid-Market</SelectItem>
                <SelectItem value="smb">SMB</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" ||
              lifecycleFilter !== "all" ||
              tierFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter("all")
                  setLifecycleFilter("all")
                  setTierFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-sm text-muted-foreground">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}{" "}
            found
          </div>
        )}

        {/* Accounts Table */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <AccountsTable accounts={accounts} />
        )}
      </main>
    </div>
  )
}
