'use client'
import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { addOdometerReading } from '@/db/queries/odometer'
import { recognizeOdometerText } from '@/services/ocr'

interface OdometerModalProps {
  isOpen: boolean
  defaultType: 'start' | 'end'
  onClose: () => void
  onSaved: () => void
}

export function OdometerModal({ isOpen, defaultType, onClose, onSaved }: OdometerModalProps) {
  const [type, setType] = useState<'start' | 'end' | 'manual'>(defaultType)
  const [kmInput, setKmInput] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)
  const [gpsMode, setGpsMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    const uri = URL.createObjectURL(file)
    setOcrPreview(uri)
    try {
      const result = await recognizeOdometerText(uri)
      if (result.extractedKm) {
        setKmInput(result.extractedKm.toString())
      }
    } catch {
      // If OCR fails, user can enter manually
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSave = async () => {
    const km = parseInt(kmInput, 10)
    if (!km || km <= 0) return
    await addOdometerReading({
      kmValue: km,
      type: type === 'manual' ? 'manual' : type,
      source: ocrPreview ? 'ocr' : 'manual',
      readAt: new Date().toISOString(),
    })
    setKmInput('')
    setOcrPreview(null)
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar km">
      <div className="flex flex-col gap-4 p-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {(['start', 'end', 'manual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t === 'start' ? 'Inicio' : t === 'end' ? 'Fin' : 'Manual'}
            </button>
          ))}
        </div>

        {/* Photo capture */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 bg-gray-100 rounded-xl text-gray-700 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {ocrLoading ? '⏳ Leyendo...' : '📷 Foto del odómetro'}
          </button>
          {ocrPreview && (
            <div className="mt-2 relative rounded-xl overflow-hidden h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ocrPreview} alt="Odómetro" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Manual input */}
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Kilómetros</label>
          <input
            type="number"
            inputMode="numeric"
            value={kmInput}
            onChange={e => setKmInput(e.target.value)}
            placeholder="143521"
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* GPS toggle */}
        <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
          <div>
            <p className="text-sm font-semibold text-blue-800">Usar posición GPS</p>
            <p className="text-xs text-blue-500">⚠️ Consume más batería</p>
          </div>
          <button
            onClick={() => setGpsMode(g => !g)}
            className={`w-12 h-6 rounded-full transition-colors ${gpsMode ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${gpsMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <Button
          onClick={handleSave}
          disabled={!kmInput || parseInt(kmInput) <= 0}
          className="w-full"
          size="lg"
        >
          Guardar lectura
        </Button>
      </div>
    </Modal>
  )
}
