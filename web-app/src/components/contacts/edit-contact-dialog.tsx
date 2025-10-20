"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ContactForm } from "./contact-form"
import type { Contact } from "@/types"
import { Edit } from "lucide-react"

interface EditContactDialogProps {
  workspaceId: string
  contact: Contact
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EditContactDialog({
  workspaceId,
  contact,
  onSuccess,
  trigger,
}: EditContactDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information for {contact.full_name}
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          workspaceId={workspaceId}
          contact={contact}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
