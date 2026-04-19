'use client'
import { type Destination } from '@/db/schema'

interface DestinationPickerProps {
  destinations: Destination[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function DestinationPicker({ destinations, selectedId, onSelect }: DestinationPickerProps) {
  if (destinations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-4xl mb-2">📍</p>
        <p className="text-sm">Añade destinos en Ajustes primero</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 px-4 py-2">
      {destinations.map(dest => {
        const isSelected = selectedId === dest.id
        return (
          <button
            key={dest.id}
            onPointerDown={e => { e.preventDefault(); onSelect(dest.id!) }}
            className="relative py-4 px-3 rounded-2xl text-white font-semibold text-sm text-center transition-all active:scale-95 min-h-[64px] flex items-center justify-center"
            style={{ backgroundColor: dest.color, opacity: isSelected ? 1 : 0.6, outline: isSelected ? `3px solid ${dest.color}` : 'none', outlineOffset: '2px' }}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs" style={{ color: dest.color }}>✓</span>
            )}
            {dest.name}
          </button>
        )
      })}
    </div>
  )
}
