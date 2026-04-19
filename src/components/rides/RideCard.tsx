'use client'
import { type Ride } from '@/db/schema'
import { formatEurosShort } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'

interface RideCardProps {
  ride: Ride
  onDelete?: (id: number) => void
}

export function RideCard({ ride, onDelete }: RideCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white border-b border-gray-50">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: ride.destinationColor }}
      >
        {ride.destinationName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{ride.destinationName}</p>
        <p className="text-xs text-gray-400">{formatDateTime(ride.riddenAt)}{ride.kmGps ? ` · ${ride.kmGps.toFixed(1)} km` : ''}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-emerald-600 font-bold text-lg">{formatEurosShort(ride.priceCents)}</span>
        {onDelete && (
          <button
            onClick={() => {
              if (confirm('¿Eliminar esta carrera?')) onDelete(ride.id!)
            }}
            className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-xs hover:bg-red-100 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
