'use client'
import { useState, useRef, useEffect } from 'react'
import { Camera } from 'lucide-react'
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
  const [type, setType] = useState<'start' | 'end'>(defaultType)
  const [kmInput, setKmInput] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)
  const [ocrRaw, setOcrRaw] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Sync type when defaultType prop changes (e.g. click Fin vs Inicio)
  useEffect(() => {
    if (isOpen) {
      setType(defaultType)
      setKmInput('')
      setOcrPreview(null)
      setOcrRaw('')
    }
  }, [isOpen, defaultType])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setOcrLoading(true)
    const uri = URL.createObjectURL(file)
    setOcrPreview(uri)
    try {
      const result = await recognizeOdometerText(uri)
      setOcrRaw(result.rawText.trim())
      if (result.extractedKm) {
        setKmInput(result.extractedKm.toString())
      }
    } catch {
      setOcrRaw('Error al leer imagen')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSave = async () => {
    const km = parseInt(kmInput, 10)
    if (!km || km <= 0) return
    await addOdometerReading({
      kmValue: km,
      type,
      source: ocrPreview ? 'ocr' : 'manual',
      readAt: new Date().toISOString(),
    })
    setKmInput('')
    setOcrPreview(null)
    setOcrRaw('')
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar km">
      <div className="flex flex-col gap-4 p-4">
        {/* Type selector: only Inicio / Fin */}
        <div className="flex gap-2">
          {(['start', 'end'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t === 'start' ? 'Inicio' : 'Fin'}
            </button>
          ))}
        </div>

        {/* Photo capture */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={ocrLoading}
            className="w-full py-3 bg-gray-100 rounded-xl text-gray-700 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            <Camera size={18} />
            {ocrLoading ? 'Leyendo imagen...' : 'Foto del odómetro (OCR)'}
          </button>
          {ocrPreview && (
            <div className="mt-2 rounded-xl overflow-hidden h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ocrPreview} alt="Odómetro" className="w-full h-full object-cover" />
            </div>
          )}
          {ocrRaw && !ocrLoading && (
            <p className="mt-1 text-xs text-gray-400">
              OCR: <span className="font-mono">{ocrRaw.slice(0, 80)}</span>
            </p>
          )}
        </div>

        {/* Km input — editable always so user can correct OCR result */}
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
            Kilómetros {ocrPreview && kmInput ? '(corrige si es necesario)' : ''}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={kmInput}
            onChange={e => setKmInput(e.target.value)}
            placeholder="143521"
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
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
