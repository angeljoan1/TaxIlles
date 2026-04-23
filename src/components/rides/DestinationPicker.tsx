'use client'
import { MapPin } from 'lucide-react'
import { type Destination } from '@/db/schema'

interface DestinationPickerProps {
  destinations: Destination[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function DestinationPicker({ destinations, selectedId, onSelect }: DestinationPickerProps) {
  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 gap-2" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
        <MapPin size={32} />
        <p className="text-sm">Añade destinos en Ajustes primero</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {destinations.map(dest => {
        const isSelected = selectedId === dest.id
        return (
          <button
            key={dest.id}
            onPointerDown={e => { e.preventDefault(); onSelect(dest.id!) }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-semibold text-sm transition-all active:scale-95"
            style={
              isSelected
                ? {
                    background: `${dest.color}22`,
                    border: `1.5px solid ${dest.color}`,
                    color: dest.color,
                  }
                : {
                    background: 'var(--surface2)',
                    border: '1.5px solid transparent',
                    color: 'var(--foreground)',
                    opacity: 0.6,
                  }
            }
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: isSelected ? dest.color : 'var(--foreground)', opacity: isSelected ? 1 : 0.5 }}
            />
            {dest.name}
          </button>
        )
      })}
    </div>
  )
}
