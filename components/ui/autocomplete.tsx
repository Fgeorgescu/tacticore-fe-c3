"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AutocompleteProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  disabled?: boolean
  onCustomValue?: (value: string) => boolean // Return true if custom value is valid
}

export function Autocomplete({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  className,
  disabled = false,
  onCustomValue,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const [isValid, setIsValid] = React.useState(true)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue)
    onValueChange(selectedValue)
    setOpen(false)
    setIsValid(true)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onValueChange(newValue)
    
    // Check if the value is valid
    if (onCustomValue) {
      const valid = onCustomValue(newValue)
      setIsValid(valid)
    } else {
      // Default validation: check if it's in the options list
      setIsValid(options.includes(newValue) || newValue === "")
    }
  }

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className={cn("space-y-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !isValid && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen(!open)
            }}
          >
            {inputValue || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 z-50" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar mapa..."
              value={inputValue}
              onValueChange={handleInputChange}
            />
            <CommandList>
              <CommandEmpty>No se encontraron mapas.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(option)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        inputValue === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!isValid && inputValue && (
        <p className="text-sm text-red-500">
          ⚠️ Mapa no reconocido. Verifica el nombre.
        </p>
      )}
    </div>
  )
}
