"use client"

import { useState, useCallback } from 'react'

interface UserValidationResult {
  isValid: boolean
  user?: {
    id: string
    name: string
    role: string
    averageScore: number
    totalKills: number
    totalDeaths: number
    totalMatches: number
    kdr: number
  }
  error?: string
}

export function useUserValidation() {
  const [isValidating, setIsValidating] = useState(false)

  const validateUser = useCallback(async (userName: string): Promise<UserValidationResult> => {
    if (!userName || userName.trim() === '') {
      return { isValid: false, error: 'Nombre de usuario requerido' }
    }

    setIsValidating(true)
    
    try {
      const response = await fetch(`http://localhost:8080/api/users/${encodeURIComponent(userName.trim())}`)
      
      if (response.ok) {
        const user = await response.json()
        return {
          isValid: true,
          user: {
            id: user.id.toString(),
            name: user.name,
            role: user.role,
            averageScore: user.averageScore || 0,
            totalKills: user.totalKills || 0,
            totalDeaths: user.totalDeaths || 0,
            totalMatches: user.totalMatches || 0,
            kdr: user.kdr || 0
          }
        }
      } else if (response.status === 404) {
        return { isValid: false, error: 'Usuario no encontrado' }
      } else {
        return { isValid: false, error: 'Error al validar usuario' }
      }
    } catch (error) {
      console.error('Error validating user:', error)
      return { isValid: false, error: 'Error de conexión' }
    } finally {
      setIsValidating(false)
    }
  }, [])

  const searchUsers = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      const response = await fetch(`http://localhost:8080/api/users/search?name=${encodeURIComponent(query.trim())}`)
      
      if (response.ok) {
        const users = await response.json()
        return users.map((user: any) => user.name)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
    
    return []
  }, [])

  return {
    validateUser,
    searchUsers,
    isValidating
  }
}

