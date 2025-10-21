"use client"

import type { Contact } from "@/types"
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
import { useRouter } from "next/navigation"
import { Building2, Mail, Phone, Crown, Award } from "lucide-react"

interface ContactsTableProps {
  contacts: Contact[]
  selectedContacts?: Set<string>
  onSelectContact?: (contactId: string) => void
}

export function ContactsTable({ contacts, selectedContacts = new Set(), onSelectContact }: ContactsTableProps) {
  const router = useRouter()

  const getStatusBadgeVariant = (
    status: Contact["status"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "active":
        return "default"
      case "bounced":
        return "destructive"
      case "opted_out":
        return "secondary"
      case "invalid":
        return "destructive"
      case "archived":
        return "outline"
      default:
        return "default"
    }
  }

  const handleRowClick = (contactId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox
    const target = e.target as HTMLElement
    if (target.closest('[data-checkbox]')) {
      return
    }
    router.push(`/contacts/${contactId}`)
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No contacts found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectContact && <TableHead className="w-12"></TableHead>}
            <TableHead>Name</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Influence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => handleRowClick(contact.id, e)}
            >
              {onSelectContact && (
                <TableCell data-checkbox onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={() => onSelectContact(contact.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{contact.full_name}</span>
                  {contact.department && (
                    <span className="text-xs text-muted-foreground">
                      {contact.department}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {contact.job_title && (
                    <span className="text-sm">{contact.job_title}</span>
                  )}
                  {contact.seniority_level && (
                    <span className="text-xs text-muted-foreground">
                      {contact.seniority_level}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {contact.account_id ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Account linked
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {contact.email ? (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {contact.phone || contact.mobile_phone ? (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {contact.mobile_phone || contact.phone}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(contact.status)}>
                  {contact.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {contact.is_decision_maker && (
                    <Badge variant="default" className="gap-1">
                      <Crown className="h-3 w-3" />
                      Decision Maker
                    </Badge>
                  )}
                  {contact.is_champion && (
                    <Badge variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      Champion
                    </Badge>
                  )}
                  {!contact.is_decision_maker && !contact.is_champion && (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
