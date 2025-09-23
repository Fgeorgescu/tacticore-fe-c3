"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Lista de usuarios disponibles para la demo
export const AVAILABLE_USERS = [
  { id: 'all', name: 'Todos los usuarios', value: null },
  { id: 'flameZ', name: 'flameZ', value: 'flameZ' },
  { id: 'Senzu', name: 'Senzu', value: 'Senzu' },
  { id: 'bLitz', name: 'bLitz', value: 'bLitz' },
  { id: 'ropz', name: 'ropz', value: 'ropz' },
  { id: 'ZywOo', name: 'ZywOo', value: 'ZywOo' },
  { id: 'apEX', name: 'apEX', value: 'apEX' },
  { id: 'mezii', name: 'mezii', value: 'mezii' },
  { id: 'malbsMd', name: 'malbsMd', value: 'malbsMd' },
  { id: 'frozen', name: 'frozen', value: 'frozen' },
  { id: 'sh1ro', name: 'sh1ro', value: 'sh1ro' },
  { id: 'nettik', name: 'nettik', value: 'nettik' },
  { id: 'Mzinho', name: 'Mzinho', value: 'Mzinho' },
  { id: '910-', name: '910-', value: '910-' },
]

// Usuario para despersonalizar (mostrar datos generales)
export const IMPERSONAL_USER = { id: 'impersonal', name: 'Despersonalizar', value: null }

export interface User {
  id: string
  name: string
  value: string | null
}

interface UserContextType {
  selectedUser: User
  updateUser: (user: User) => void
  availableUsers: User[]
  impersonalUser: User
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<User>(AVAILABLE_USERS[0])

  // Cargar desde localStorage solo en el cliente
  useEffect(() => {
    const savedUser = localStorage.getItem('selectedUser')
    if (savedUser) {
      const user = AVAILABLE_USERS.find(u => u.id === savedUser)
      if (user) {
        setSelectedUser(user)
      }
    }
  }, [])

  const updateUser = (user: User) => {
    setSelectedUser(user)
    localStorage.setItem('selectedUser', user.id)
  }

  return (
    <UserContext.Provider value={{
      selectedUser,
      updateUser,
      availableUsers: AVAILABLE_USERS,
      impersonalUser: IMPERSONAL_USER
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
