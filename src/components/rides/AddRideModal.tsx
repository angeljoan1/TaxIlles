'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { NumberKeypad } from '@/components/ui/NumberKeypad'
import { DestinationPicker } from './DestinationPicker'
import { getActiveDestinations } from '@/db/queries/destinations'
import { type Destination } from '@/db/schema'
import { addRide } from '@/db/queries/rides'

interface AddRideModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function AddRideModal({ isOpen, onClose, onSaved }: AddRideModalProps) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [priceCents, setPriceCents] = useState('')

  useEffect(() => {
    if (isOpen) {
      getActiveDestinations().then(setDestinations)
      setSelectedId(null)
      setPriceCents('')
    }
  }, [isOpen])

  const canSave = selectedId !== null && priceCents !== '' && parseInt(priceCents) > 0

  const handleSave = async () => {
    if (!canSave) return
    const dest = destinations.find(d => d.id === selectedId)!
    await addRide({
      destinationId: selectedId!,
      destinationName: dest.name,
      destinationColor: dest.color,
      priceCents: parseInt(priceCents, 10),
      riddenAt: new Date().toISOString(),
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
