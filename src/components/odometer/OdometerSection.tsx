'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { OdometerModal } from './OdometerModal'
import { getTodayOdometer } from '@/db/queries/odometer'
import { type OdometerReading } from '@/db/schema'

export function OdometerSection() {
  const [start, setStart] = useState<OdometerReading | undefined>()
  const [end, setEnd] = useState<OdometerReading | undefined>()
  const [showModal, setShowModal] = useState(false)
  const [typeToAdd, setTypeToAdd] = useState<'start' | 'end'>('start')

  const refresh = useCallback(async () => {
    const data = await getTodayOdometer()
    setStart(data.start)
    setEnd(data.end)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const km = start && end ? end.kmValue - start.kmValue : null

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Odómetro hoy</p>
          {km !== null && (
            <span className="text-sm font-bold text-indigo-600">{km.toLocaleString('es-ES')} km</span>
          )}
        </div>
        <div className="flex gap-3">
          <OdometerReadingBtn
            label="Inicio"
            reading={start}
            onClick={() => { setTypeToAdd('start'); setShowModal(true) }}
          />
          <OdometerReadingBtn
            label="Fin"
            reading={end}
            onClick={() => { setTypeToAdd('end'); setShowModal(true) }}
          />
        </div>
      </Card>
      <OdometerModal
        isOpen={showModal}
        defaultType={typeToAdd}
        onClose={() => setShowModal(false)}
        onSaved={refresh}
      />
    </>
  )
}

function OdometerReadingBtn({ label, reading, onClick }: { label: string; reading?: OdometerReading; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all active:scale-95"
      style={reading ? { borderStyle: 'solid', borderColor: '#6366f1', backgroundColor: '#eef2ff' } : {}}
    >
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      {reading ? (
        <p className="text-indigo-700 font-bold">{reading.kmValue.toLocaleString('es-ES')} km</p>
      ) : (
        <p className="text-gray-300 text-lg">+</p>
      )}
    </button>
  )
}
