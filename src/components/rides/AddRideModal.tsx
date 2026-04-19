'use client'
import { useState, useEffect, useRef } from 'react'
import { Navigation } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { NumberKeypad } from '@/components/ui/NumberKeypad'
import { DestinationPicker } from './DestinationPicker'
import { getActiveDestinations } from '@/db/queries/destinations'
import { type Destination } from '@/db/schema'
import { addRide } from '@/db/queries/rides'
import { watchPosition, haversineKm, type GpsPoint } from '@/services/gps'

interface AddRideModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function AddRideModal({ isOpen, onClose, onSaved }: AddRideModalProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [priceCents, setPriceCents] = useState('')
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [gpsKm, setGpsKm] = useState<number | null>(null)
  const gpsPointsRef = useRef<GpsPoint[]>([])
  const stopGpsRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isOpen) {
      getActiveDestinations().then(setDestinations)
      setSelectedId(null)
      setPriceCents('')
    } else {
      // Clean up GPS when modal closes
      stopGpsRef.current?.()
      stopGpsRef.current = null
      setGpsEnabled(false)
      setGpsKm(null)
      gpsPointsRef.current = []
    }
  }, [isOpen])

  const handleToggleGps = () => {
    if (gpsEnabled) {
      stopGpsRef.current?.()
      stopGpsRef.current = null
      setGpsEnabled(false)
    } else {
      setGpsEnabled(true)
      gpsPointsRef.current = []
      stopGpsRef.current = watchPosition(point => {
        const pts = gpsPointsRef.current
        pts.push(point)
        if (pts.length >= 2) {
          let total = 0
          for (let i = 1; i < pts.length; i++) total += haversineKm(pts[i - 1], pts[i])
          setGpsKm(Math.round(total * 10) / 10)
        }
      })
    }
  }

  const canSave = selectedId !== null && priceCents !== '' && parseInt(priceCents) > 0

  const handleSave = async () => {
    if (!canSave) return
    stopGpsRef.current?.()
    stopGpsRef.current = null
    const dest = destinations.find(d => d.id === selectedId)!
    await addRide({
      destinationId: selectedId!,
      destinationName: dest.name,
      destinationColor: dest.color,
      priceCents: parseInt(priceCents, 10),
      riddenAt: new Date().toISOString(),
      kmGps: gpsKm ?? undefined,
    })
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Carrera">
      <div className="flex flex-col gap-1">
        <p className="px-4 pt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Destino</p>
        <DestinationPicker destinations={destinations} selectedId={selectedId} onSelect={setSelectedId} />
        <p className="px-4 pt-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Precio</p>
        <NumberKeypad value={priceCents} onChange={setPriceCents} />

        {/* GPS km tracking */}
        <div className="px-4 pb-1">
          <button
            onClick={handleToggleGps}
            className={`w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${
              gpsEnabled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Navigation size={15} />
            {gpsEnabled
              ? `GPS activo${gpsKm !== null ? ` · ${gpsKm} km` : ' · calculando...'}`
              : 'Activar GPS (consume batería)'}
          </button>
        </div>

        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-4 bg-emerald-500 text-white text-lg font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar Carrera
          </button>
        </div>
      </div>
    </Modal>
  )
}
