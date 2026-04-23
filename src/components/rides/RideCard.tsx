'use client'
import { useState } from 'react'
import { type Ride } from '@/db/schema'
import { formatEurosShort } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'

interface RideCardProps {
  ride: Ride
  onDelete?: (id: number) => void
}

export function RideCard({ ride, onDelete }: RideCardProps) {
  const [confirming, setConfirming] = useState(false)

  const handleDelete = () => {
    if (confirming) {
      onDelete?.(ride.id!)
    } else {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    }
  }

  return (
    <div
      className="flex items-center gap-3 py-3.5 px-4"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'var(--surface)' }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: ride.destinationColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: 'var(--foreground)', fontSize: 15 }}>
          {ride.destinationName}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
          {formatDateTime(ride.riddenAt)}
          {ride.kmGps ? ` · ${ride.kmGps.toFixed(1)} km` : ''}
        </p>
      </div>

      <span className="text-base font-bold" style={{ color: 'var(--emerald)' }}>
        {formatEurosShort(ride.priceCents)}
      </span>

      {onDelete && (
        <button
          onClick={handleDelete}
          className="ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95"
          style={
            confirming
              ? { background: 'rgba(239,68,68,0.12)', color: '#ef4444' }
              : { background: 'var(--surface2)', color: 'var(--foreground)', opacity: 0.4 }
          }
        >
          {confirming ? '¿Borrar?' : '✕'}
        </button>
      )}
    </div>
  )
}
