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
    <Modal isOpen={isOpen} onClose={onClose} title="Nova cursa">
      <div className="flex flex-col gap-1 pb-2">
        <p
          className="px-4 pt-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--foreground)', opacity: 0.4 }}
        >
          Destí
        </p>
        <DestinationPicker destinations={destinations} selectedId={selectedId} onSelect={setSelectedId} />

        <NumberKeypad value={priceCents} onChange={setPriceCents} />

        {/* GPS toggle */}
        <div className="px-4 pb-1">
          <button
            onClick={handleToggleGps}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
            style={
              gpsEnabled
                ? { background: 'rgba(16,185,129,0.12)', color: 'var(--emerald)' }
                : { background: 'var(--surface2)', color: 'var(--foreground)', opacity: 0.6 }
            }
          >
            <Navigation size={15} />
            {gpsEnabled
              ? `GPS actiu${gpsKm !== null ? ` · ${gpsKm} km` : ' · calculant...'}`
              : 'Activar GPS (consumeix bateria)'}
          </button>
        </div>

        <div className="px-4 pt-1 pb-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-4 text-white text-base font-extrabold rounded-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--emerald)' }}
          >
            Guardar cursa
          </button>
        </div>
      </div>
    </Modal>
  )
}
