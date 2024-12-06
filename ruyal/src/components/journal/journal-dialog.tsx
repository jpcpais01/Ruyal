import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

interface JournalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JournalDialog({ open, onOpenChange }: JournalDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = () => {
    // TODO: Handle journal entry submission
    console.log({ title, content })
    onOpenChange(false)
    setTitle("")
    setContent("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>
            Record your dream or experience. What did you see or feel?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="title"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Textarea
              id="content"
              placeholder="Describe your dream..."
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
