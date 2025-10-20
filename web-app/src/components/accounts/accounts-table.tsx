"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Account } from "@/types"
import { useRouter } from "next/navigation"
import { Building2, CheckCircle2 } from "lucide-react"

interface AccountsTableProps {
  accounts: Account[]
  selectedAccounts?: Set<string>
  onSelectAccount?: (accountId: string) => void
}

export function AccountsTable({ accounts, selectedAccounts = new Set(), onSelectAccount }: AccountsTableProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "merged":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "duplicate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getLifecycleColor = (stage?: string | null) => {
    if (!stage) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"

    switch (stage) {
      case "target":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300"
      case "engaged":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "opportunity":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "customer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "churned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const isEnriched = (account: Account) => {
    return !!account.enriched_at
  }

  const handleRowClick = (accountId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox
    const target = e.target as HTMLElement
    if (target.closest('[data-checkbox]')) {
      return
    }
    router.push(`/accounts/${accountId}`)
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
        <p className="text-sm text-muted-foreground">
          Get started by creating your first account.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectAccount && <TableHead className="w-12"></TableHead>}
            <TableHead>Name</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Employee Range</TableHead>
            <TableHead>Lifecycle Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Contacts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow
              key={account.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => handleRowClick(account.id, e)}
            >
              {onSelectAccount && (
                <TableCell data-checkbox onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedAccounts.has(account.id)}
                    onCheckedChange={() => onSelectAccount(account.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {account.name}
                  {isEnriched(account) && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" title="Enriched" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                {account.domain ? (
                  <span className="text-sm text-muted-foreground">
                    {account.domain}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    No domain
                  </span>
                )}
              </TableCell>
              <TableCell>
                {account.industry ? (
                  <Badge variant="outline" className="text-xs">
                    {account.industry}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {account.employee_range ? (
                  <span className="text-sm">{account.employee_range}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {account.lifecycle_stage ? (
                  <Badge className={getLifecycleColor(account.lifecycle_stage)}>
                    {account.lifecycle_stage}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(account.status)}>
                  {account.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium">{account.contact_count}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
