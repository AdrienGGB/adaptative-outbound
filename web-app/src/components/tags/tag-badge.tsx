"use client"

import { Tag } from "@/types"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagBadgeProps {
  tag: Tag
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export function TagBadge({ tag, removable = false, onRemove, className }: TagBadgeProps) {
  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border",
        className
      )}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: tag.color,
        color: tag.color,
      }}
    >
      <span className="truncate">{tag.name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}
