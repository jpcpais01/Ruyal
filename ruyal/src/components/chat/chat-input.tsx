"use client"

import { useState, KeyboardEvent } from "react"
import { Send, Save, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onSaveChat?: () => void
  onNew?: () => void
  disabled?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function ChatInput({ onSend, onSaveChat, onNew, disabled, placeholder, value, onChange }: ChatInputProps) {
  const [internalMessage, setInternalMessage] = useState("")
  
  // Use either controlled or uncontrolled message
  const message = value !== undefined ? value : internalMessage
  const setMessage = onChange || setInternalMessage

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 bg-background" data-chat-form>
      {onNew && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNew}
          disabled={disabled}
          className="h-10 w-10 shrink-0"
        >
          <PlusCircle className="h-5 w-5" />
        </Button>
      )}
      {onSaveChat && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveChat}
          disabled={disabled}
          className="h-10 w-10 shrink-0"
        >
          <Save className="h-5 w-5" />
        </Button>
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type a message..."}
        rows={1}
        data-chat-input
        className={cn(
          "flex-1 min-h-[48px] max-h-[48px] py-3 px-4",
          "bg-muted rounded-xl resize-none",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          "placeholder:text-muted-foreground",
          "scrollbar-hide overflow-hidden",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={cn(
          "flex-none w-[48px] h-[48px]",
          "flex items-center justify-center",
          "rounded-xl bg-primary text-primary-foreground",
          "transition-all duration-200",
          "hover:opacity-90 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  )
}
