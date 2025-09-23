"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, useUser } from "@/contexts/UserContext"
import { User as UserIcon, LogOut } from "lucide-react"

interface UserSelectorProps {
  className?: string
}

export function UserSelector({ className }: UserSelectorProps) {
  const { selectedUser, updateUser, availableUsers, impersonalUser } = useUser()

  const handleUserChange = (value: string) => {
    if (value === 'impersonal') {
      updateUser(impersonalUser)
    } else {
      const user = availableUsers.find(u => u.id === value)
      if (user) {
        updateUser(user)
      }
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <UserIcon className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedUser.id} onValueChange={handleUserChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar usuario" />
        </SelectTrigger>
        <SelectContent>
          {availableUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
          <SelectItem value="impersonal" className="text-muted-foreground">
            <div className="flex items-center gap-2">
              <LogOut className="h-3 w-3" />
              {impersonalUser.name}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
