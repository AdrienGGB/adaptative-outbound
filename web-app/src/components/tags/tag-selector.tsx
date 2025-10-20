"use client"

import { useState, useEffect } from "react"
import { EntityType, Tag, TAG_COLORS } from "@/types"
import { getTags, createTag, addTagToEntity, removeTagFromEntity } from "@/services"
import { TagBadge } from "./tag-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Tag as TagIcon } from "lucide-react"
import { toast } from "sonner"

interface TagSelectorProps {
  workspaceId: string
  entityType: EntityType
  entityId: string
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
}

export function TagSelector({
  workspaceId,
  entityType,
  entityId,
  selectedTags,
  onChange,
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[10]) // Default blue
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadTags()
  }, [workspaceId, entityType])

  const loadTags = async () => {
    try {
      setIsLoading(true)
      const tags = await getTags(workspaceId, entityType)
      setAvailableTags(tags)
    } catch (error) {
      console.error("Failed to load tags:", error)
      toast.error("Failed to load tags")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = async (tag: Tag) => {
    try {
      await addTagToEntity(tag.id, entityType, entityId)
      onChange([...selectedTags, tag])
      toast.success(`Added tag: ${tag.name}`)
    } catch (error) {
      console.error("Failed to add tag:", error)
      toast.error("Failed to add tag")
    }
  }

  const handleRemoveTag = async (tag: Tag) => {
    try {
      await removeTagFromEntity(tag.id, entityType, entityId)
      onChange(selectedTags.filter((t) => t.id !== tag.id))
      toast.success(`Removed tag: ${tag.name}`)
    } catch (error) {
      console.error("Failed to remove tag:", error)
      toast.error("Failed to remove tag")
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required")
      return
    }

    setIsCreating(true)
    try {
      const newTag = await createTag({
        workspace_id: workspaceId,
        name: newTagName.trim(),
        color: newTagColor,
        description: null,
        entity_type: entityType,
        created_by: null,
      })

      setAvailableTags([...availableTags, newTag])
      await handleAddTag(newTag)

      // Reset form
      setNewTagName("")
      setNewTagColor(TAG_COLORS[10])
      setShowCreateForm(false)

      toast.success(`Created tag: ${newTag.name}`)
    } catch (error) {
      console.error("Failed to create tag:", error)
      toast.error("Failed to create tag")
    } finally {
      setIsCreating(false)
    }
  }

  const selectedTagIds = new Set(selectedTags.map((t) => t.id))
  const unselectedTags = availableTags.filter((tag) => !selectedTagIds.has(tag.id))

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Selected Tags</Label>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                removable
                onRemove={() => handleRemoveTag(tag)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags selected</p>
        )}
      </div>

      <Separator />

      {/* Available Tags */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Available Tags</Label>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading tags...</div>
        ) : unselectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unselectedTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <TagBadge tag={tag} />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {selectedTags.length > 0
              ? "All tags are selected"
              : "No tags available"}
          </p>
        )}
      </div>

      <Separator />

      {/* Create New Tag */}
      {!showCreateForm ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Tag
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-color">Color</Label>
              <Select value={newTagColor} onValueChange={(value: string) => setNewTagColor(value)}>
                <SelectTrigger id="tag-color">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: newTagColor }}
                      />
                      <span>{newTagColor}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TAG_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color }}
                        />
                        <span>{color}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewTagName("")
                }}
                disabled={isCreating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateTag}
                disabled={isCreating || !newTagName.trim()}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
