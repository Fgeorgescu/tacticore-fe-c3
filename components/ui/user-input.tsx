"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, LogOut, Search, Check, X } from 'lucide-react'
import { useUserValidation } from '@/hooks/useUserValidation'
import { useUser } from '@/contexts/UserContext'

interface UserInputProps {
  className?: string
}

export function UserInput({ className }: UserInputProps) {
  const { selectedUser, updateUser } = useUser()
  const { validateUser, searchUsers, isValidating } = useUserValidation()
  
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Inicializar con el usuario seleccionado
  useEffect(() => {
    if (selectedUser.value) {
      setInputValue(selectedUser.name)
      setValidationResult({ isValid: true })
    } else {
      setInputValue('')
      setValidationResult(null)
    }
  }, [selectedUser])

  // Manejar búsqueda de usuarios
  const handleInputChange = async (value: string) => {
    setInputValue(value)
    setValidationResult(null)
    
    if (value.length >= 2) {
      setIsSearching(true)
      try {
        const results = await searchUsers(value)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch (error) {
        console.error('Error searching users:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Manejar selección de sugerencia
  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion)
    setShowSuggestions(false)
    handleUserValidation(suggestion)
  }

  // Validar usuario
  const handleUserValidation = async (userName?: string) => {
    const nameToValidate = userName || inputValue.trim()
    
    if (!nameToValidate) {
      setValidationResult({ isValid: false, error: 'Nombre de usuario requerido' })
      return
    }

    const result = await validateUser(nameToValidate)
    setValidationResult(result)
    
    if (result.isValid && result.user) {
      updateUser({
        id: result.user.id,
        name: result.user.name,
        value: result.user.name
      })
    }
  }

  // Despersonalizar
  const handleImpersonalize = () => {
    setInputValue('')
    setValidationResult(null)
    updateUser({
      id: 'impersonal',
      name: 'Despersonalizar',
      value: null
    })
  }

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <User className="h-4 w-4 text-muted-foreground" />
      
      <div className="relative flex-1">
        <div className="flex gap-1">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUserValidation()
              } else if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            placeholder="Ingresar nombre de usuario..."
            className={`w-[200px] ${validationResult?.isValid ? 'border-green-500' : validationResult?.error ? 'border-red-500' : ''}`}
            disabled={isValidating}
          />
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUserValidation()}
            disabled={isValidating || !inputValue.trim()}
            className="px-2"
          >
            {isValidating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border bg-background shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3 w-3" />
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mensaje de validación */}
        {validationResult && (
          <div className="absolute top-full left-0 right-0 mt-1 text-xs">
            {validationResult.isValid ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                Usuario válido
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <X className="h-3 w-3" />
                {validationResult.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón despersonalizar */}
      {selectedUser.value && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleImpersonalize}
          className="px-2"
          title="Despersonalizar"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
