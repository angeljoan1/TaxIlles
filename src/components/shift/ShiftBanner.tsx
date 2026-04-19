'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { OdometerModal } from '@/components/odometer/OdometerModal'
import { getActiveShift, startShift, endShift } from '@/db/queries/shifts'
import { type Shift } from '@/db/schema'
import { formatDuration, formatDateTime } from '@/utils/date'

interface ShiftBannerProps {
  onUpdate?: () => void
}

export function ShiftBanner({ onUpdate }: ShiftBannerProps) {
  const [shift, setShift] = useState<Shift | null>(null)
  const [tick, setTick] = useState(0)
  const [showStartKm, setShowStartKm] = useState(false)
  const [showEndKm, setShowEndKm] = useState(false)
  const startKmSavedRef = useRef(false)
  const endKmSavedRef = useRef(false)

  const refresh = useCallback(async () => {
    const active = await getActiveShift()
    setShift(active ?? null)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!shift) return
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [shift])

  // --- START SHIFT FLOW ---
  const handleStartClick = () => {
    startKmSavedRef.current = false
    setShowStartKm(true)
  }

  const handleStartKmSaved = () => {
    startKmSavedRef.current = true
  }

  const handleStartKmClose = async () => {
    setShowStartKm(false)
    const saved = startKmSavedRef.current
    startKmSavedRef.current = false
    if (saved || confirm('¿Empezar turno sin registrar km de inicio?')) {
      await startShift()
      await refresh()
      onUpdate?.()
    }
  }

  // --- END SHIFT FLOW ---
  const handleEndClick = () => {
    endKmSavedRef.current = false
    setShowEndKm(true)
  }

  const handleEndKmSaved = () => {
    endKmSavedRef.current = true
  }

  const handleEndKmClose = async () => {
    setShowEndKm(false)
    const saved = endKmSavedRef.current
    endKmSavedRef.current = false
    if (!shift?.id) return
    if (saved || confirm('¿Finalizar turno sin registrar km de fin?')) {
      await endShift(shift.id)
      await refresh()
      onUpdate?.()
    }
  }

  if (!shift) {
    return (
      <>
        <button
          onClick={handleStartClick}
          className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Clock size={16} />
          Iniciar turno
        </button>

        <OdometerModal
          isOpen={showStartKm}
          defaultType="start"
          onClose={handleStartKmClose}
          onSaved={handleStartKmSaved}
        />
      </>
    )
  }

  return (
    <>
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Turno activo</p>
            <p className="text-amber-900 font-bold text-lg">{formatDuration(shift.startAt)}</p>
            <p className="text-xs text-amber-600">Inicio: {formatDateTime(shift.startAt)}</p>
          </div>
          <button
            onClick={handleEndClick}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
          >
            Finalizar
          </button>
        </div>
        <span className="sr-only">{tick}</span>
      </Card>

      <OdometerModal
        isOpen={showEndKm}
        defaultType="end"
        onClose={handleEndKmClose}
        onSaved={handleEndKmSaved}
      />
    </>
  )
}
