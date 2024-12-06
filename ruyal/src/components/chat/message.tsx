"use client"

import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp: Date
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 w-full max-w-full px-4 overflow-hidden",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
        "w-[80%] max-w-[80%] min-w-0"
      )}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm w-full overflow-hidden",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words overflow-hidden">{message}</p>
        </div>
        <span className="px-2 text-[10px] text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
