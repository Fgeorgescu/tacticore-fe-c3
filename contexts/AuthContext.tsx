"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  name?: string
  steamId?: string
  steamUsername?: string
  role: string
  active: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, steamId?: string, steamUsername?: string) => Promise<boolean>
  steamAuth: (steamId: string, steamUsername: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos de autenticación desde localStorage al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('tacticore_token')
    const savedUser = localStorage.getItem('tacticore_user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.token)
        setUser(data.user)
        
        // Guardar en localStorage
        localStorage.setItem('tacticore_token', data.token)
        localStorage.setItem('tacticore_user', JSON.stringify(data.user))
        
        return true
      } else {
        console.error('Login failed:', data.message)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, steamId?: string, steamUsername?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const requestBody: any = { email, password }
      if (steamId) requestBody.steamId = steamId
      if (steamUsername) requestBody.steamUsername = steamUsername
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        // Después del registro exitoso, hacer login automático
        return await login(email, password)
      } else {
        console.error('Registration failed:', data.message)
        return false
      }
    } catch (error) {
      console.error('Registration error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const steamAuth = async (steamId: string, steamUsername: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/steam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steamId, steamUsername }),
      })

      const data = await response.json()

      if (data.success) {
        setToken(data.token)
        setUser(data.user)
        
        // Guardar en localStorage
        localStorage.setItem('tacticore_token', data.token)
        localStorage.setItem('tacticore_user', JSON.stringify(data.user))
        
        return true
      } else {
        console.error('Steam auth failed:', data.message)
        return false
      }
    } catch (error) {
      console.error('Steam auth error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('tacticore_token')
    localStorage.removeItem('tacticore_user')
  }

  const isAuthenticated = !!user && !!token

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    steamAuth,
    logout,
    isAuthenticated,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
