import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface AutocompleteProps {
  options: { value: number; label: string }[]
  value: number
  onChange: (value: number) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Выберите ингредиент",
  emptyMessage = "Ингредиенты не найдены",
  disabled = false,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  // Фильтрация опций по поиску
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  // Сброс индекса при изменении фильтрации
  React.useEffect(() => {
    setSelectedIndex(-1)
  }, [filteredOptions])

  // Обработчик выбора
  const handleSelect = React.useCallback((optionValue: number) => {
    onChange(optionValue)
    setOpen(false)
    setSearch('')
    setSelectedIndex(-1)
  }, [onChange])

  // Обработчик клавиш
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[selectedIndex].value)
        }
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }, [open, filteredOptions, selectedIndex, handleSelect])

  // Прокрутка к выбранному элементу
  React.useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      const selectedItem = items[selectedIndex] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
          type="button"
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Поиск ингредиента..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto"
          onKeyDown={handleKeyDown}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none",
                  selectedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50",
                  "transition-colors"
                )}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
