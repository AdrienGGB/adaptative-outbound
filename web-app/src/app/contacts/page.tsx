"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getContacts, searchContacts } from "@/services"
import type { Contact, ContactFilters } from "@/types"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export default function ContactsPage() {
  const { workspace, loading: authLoading } = useAuth()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [seniorityFilter, setSeniorityFilter] = useState<string>("all")
  const [createContactOpen, setCreateContactOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !workspace) {
      router.push("/login")
    }
  }, [authLoading, workspace, router])

  // Fetch contacts
  useEffect(() => {
    if (!workspace) return

    const fetchContacts = async () => {
      setLoading(true)
      try {
        const filters: ContactFilters = {
          workspace_id: workspace.id,
        }

        // Add filters if set
        if (statusFilter !== "all") {
          filters.status = statusFilter as any
        }
        if (departmentFilter !== "all") {
          filters.department = departmentFilter as any
        }
        if (seniorityFilter !== "all") {
          filters.seniority_level = seniorityFilter as any
        }

        let data: Contact[]
        if (searchQuery.trim()) {
          // Use search if query exists
          data = await searchContacts(searchQuery, workspace.id)
        } else {
          // Otherwise get all with filters
          data = await getContacts(filters)
        }

        setContacts(data)
      } catch (error) {
        console.error("Failed to fetch contacts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [workspace, searchQuery, statusFilter, departmentFilter, seniorityFilter])

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
                  <Users className="h-6 w-6" />
                  Contacts
                </h1>
                <p className="text-sm text-muted-foreground">
                  {workspace.name}
                </p>
              </div>
            </div>
            <Button onClick={() => setCreateContactOpen(true)}>
              New Contact
            </Button>
            <CreateContactDialog
              open={createContactOpen}
              onOpenChange={setCreateContactOpen}
              workspaceId={workspace.id}
            />
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
                placeholder="Search contacts by name or email..."
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
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="opted_out">Opted Out</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Customer Success">
                  Customer Success
                </SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={seniorityFilter}
              onValueChange={setSeniorityFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seniority Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="C-Level">C-Level</SelectItem>
                <SelectItem value="VP">VP</SelectItem>
                <SelectItem value="Director">Director</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Individual Contributor">
                  Individual Contributor
                </SelectItem>
                <SelectItem value="Entry Level">Entry Level</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" ||
              departmentFilter !== "all" ||
              seniorityFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter("all")
                  setDepartmentFilter("all")
                  setSeniorityFilter("all")
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
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}{" "}
            found
          </div>
        )}

        {/* Contacts Table */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ContactsTable contacts={contacts} />
        )}
      </main>
    </div>
  )
}
