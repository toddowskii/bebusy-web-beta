"use client"

import { useState, useMemo, useRef, useEffect } from 'react'

type Option = { key: string; label: string }

export default function TagPicker({
  value,
  onChange,
  options = [],
  placeholder = 'Filter by tags (comma-separated) e.g. react, python, machine_learning',
  maxSuggestions = 50,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options?: Option[]
  placeholder?: string
  maxSuggestions?: number
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, maxSuggestions)
    return options.filter(o => o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q)).slice(0, maxSuggestions)
  }, [query, options, maxSuggestions])

  useEffect(() => {
    setOpen(query.trim().length > 0)
  }, [query])

  function addTag(key: string) {
    if (!value.includes(key)) onChange([...value, key])
    setQuery('')
    inputRef.current?.focus()
    setOpen(false)
  }

  function removeTag(key: string) {
    onChange(value.filter(v => v !== key))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      // Try to match exact label or key
      const found = options.find(o => o.label.toLowerCase() === query.trim().toLowerCase() || o.key.toLowerCase() === query.trim().toLowerCase())
      if (found) addTag(found.key)
      e.preventDefault()
    }
    if (e.key === 'Backspace' && !query && value.length > 0) {
      // remove last
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="w-full">
      <div className="border rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-2 items-center">
          {value.map(tag => (
            <div key={tag} className="px-3 py-1 rounded-full bg-gray-700 text-sm flex items-center gap-2">
              <span>{tag.replace(/_/g, ' ')}</span>
              <button type="button" onClick={() => removeTag(tag)} className="opacity-70">✕</button>
            </div>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-w-[120px] bg-transparent outline-none px-1 py-1"
          />
        </div>
      </div>

      {open && filtered.length > 0 && (
        <div className="mt-1 max-h-48 overflow-auto rounded bg-[var(--bg-tertiary)] border" style={{ borderColor: 'var(--border)' }}>
          {filtered.map(opt => (
            <button key={opt.key} type="button" onClick={() => addTag(opt.key)} className="block w-full text-left px-3 py-2 hover:bg-gray-800">
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
