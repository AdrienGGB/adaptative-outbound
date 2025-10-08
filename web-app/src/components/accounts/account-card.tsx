import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AccountListItem } from "@/types"
import { Building2, MapPin, Users } from "lucide-react"

interface AccountCardProps {
  account: AccountListItem
}

export function AccountCard({ account }: AccountCardProps) {
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

  const formatEmployeeRange = (range?: string | null) => {
    if (!range) return null
    return range.replace("+", "+")
  }

  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-lg truncate">
                  {account.name}
                </h3>
              </div>
              {account.domain && (
                <p className="text-sm text-muted-foreground truncate">
                  {account.domain}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(account.status)}>
              {account.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Industry Badge */}
            {account.industry && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {account.industry}
                </Badge>
                {account.lifecycle_stage && (
                  <Badge className={getLifecycleColor(account.lifecycle_stage)}>
                    {account.lifecycle_stage}
                  </Badge>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {account.employee_range && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{formatEmployeeRange(account.employee_range)} employees</span>
                </div>
              )}

              {account.contact_count > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{account.contact_count}</span>
                  <span>contacts</span>
                </div>
              )}
            </div>

            {/* Last Activity */}
            {account.last_activity_at && (
              <div className="text-xs text-muted-foreground">
                Last activity: {new Date(account.last_activity_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
