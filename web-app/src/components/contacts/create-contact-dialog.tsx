"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContactForm } from "./contact-form"

interface CreateContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  accountId?: string
  onSuccess?: () => void
}

export function CreateContactDialog({
  open,
  onOpenChange,
  workspaceId,
  accountId,
  onSuccess,
}: CreateContactDialogProps) {
  // Use a key to force remount and reset form when dialog opens
  const [formKey, setFormKey] = useState(0)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormKey(prev => prev + 1)
    }
  }, [open])

  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your workspace. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          key={formKey}
          workspaceId={workspaceId}
          accountId={accountId}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
