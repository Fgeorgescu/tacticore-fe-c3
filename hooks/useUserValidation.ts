"use client"

import { useState, useCallback } from "react"
import { apiService, type UserValidationResult } from "@/lib/api"

export function useUserValidation() {
  const [isValidating, setIsValidating] = useState(false)

  const validateUser = useCallback(async (userName: string): Promise<UserValidationResult> => {
    if (!userName || userName.trim() === "") {
      return { isValid: false, error: "Nombre de usuario requerido" }
    }

    setIsValidating(true)

    try {
      const result = await apiService.validateUser(userName.trim())
      return result
    } catch (error) {
      console.error("Error validating user:", error)
      return { isValid: false, error: "Error de conexión" }
    } finally {
      setIsValidating(false)
    }
  }, [])

  const searchUsers = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      const users = await apiService.searchUsers(query.trim())
      return users
    } catch (error) {
      console.error("Error searching users:", error)
      return []
    }
  }, [])

  return {
    validateUser,
    searchUsers,
    isValidating,
  }
}
