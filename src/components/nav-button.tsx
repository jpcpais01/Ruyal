"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface NavButtonProps {
  isActive: boolean
  onClick: () => void
  icon: LucideIcon
  className?: string
  label: string
}

export function NavButton({ isActive, onClick, icon: Icon, className, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg transition-all duration-200 flex-1 text-sm flex items-center justify-center gap-2",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-primary text-primary-foreground",
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}
