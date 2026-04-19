'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getActiveDestinations, addDestination, toggleDestination, updateDestination, deleteDestination } from '@/db/queries/destinations'
import { getExpenses, addExpense, deleteExpense } from '@/db/queries/expenses'
import { getOdometerReadings, deleteOdometerReading } from '@/db/queries/odometer'
import { type Destination, type Expense, type OdometerReading, DESTINATION_COLORS, EXPENSE_CATEGORIES, db } from '@/db/schema'
import { exportRidesCSV, exportExpensesCSV, exportJSONBackup } from '@/services/export'
import { importJSONBackup, importRidesCSV } from '@/services/import'
import { formatEurosShort } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { useCrypto } from '@/context/CryptoContext'
import { useAuth } from '@/context/AuthContext'
import { getStoredLocale, setStoredLocale } from '@/i18n/provider'
import { clearBiometricCredential, isPlatformAuthenticatorAvailable } from '@/lib/crypto/biometrics'
import { deleteAllUserData } from '@/lib/supabase/queries'
import { useTranslations } from 'next-intl'
import {
  MapPin, DollarSign, Gauge, Download, Upload,
  Languages, Fingerprint, LogOut, Trash2, Plus, X,
} from 'lucide-react'

export default function AjustesPage() {
  const t = useTranslations('ajustes')
  const { user, signOut } = useAuth()
  const { enrollBiometrics, hasBiometric, setBiometricState, canUseBiometrics } = useCrypto()

  const [destinations, setDestinations] = useState<Destination[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [odometer, setOdometer] = useState<OdometerReading[]>([])
  const [showAddDest, setShowAddDest] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editDest, setEditDest] = useState<Destination | null>(null)
  const [locale, setLocaleState] = useState<'es' | 'ca'>('es')
  const [bioAvailable, setBioAvailable] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    const [d, e, o] = await Promise.all([getActiveDestinations(), getExpenses(), getOdometerReadings()])
    setDestinations(d)
    setExpenses(e)
    setOdometer(o)
  }, [])

  useEffect(() => {
    refresh()
    setLocaleState(getStoredLocale())
    isPlatformAuthenticatorAvailable().then(setBioAvailable)
  }, [refresh])

  const handleLocaleToggle = () => {
    const next = locale === 'es' ? 'ca' : 'es'
    setStoredLocale(next)
    setLocaleState(next)
  }

  const handleBiometricToggle = async () => {
    if (hasBiometric) {
      await clearBiometricCredential()
      setBiometricState(false)
    } else if (user) {
      await enrollBiometrics(user.id)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm(t('confirmarBorrar'))) return
    if (!confirm('¿Seguro? Se perderán todas las carreras, gastos y km.')) return
    await Promise.all([
      db.rides.clear(),
      db.odometer.clear(),
      db.expenses.clear(),
      db.shifts.clear(),
      db.destinations.clear(),
      deleteAllUserData().catch(() => {}),
    ])
    refresh()
  }

  const handleSignOut = async () => {
    if (!confirm('¿Cerrar sesión?')) return
    await signOut()
  }

  const handleJSONImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const result = await importJSONBackup(file)
      setImportMsg(`Importados ${result.imported} registros${result.errors ? `, ${result.errors} errores` : ''}`)
      refresh()
    } catch (err) {
      setImportMsg(`Error: ${err instanceof Error ? err.message : 'desconocido'}`)
    }
    setTimeout(() => setImportMsg(''), 4000)
  }

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const result = await importRidesCSV(file)
      setImportMsg(`Importadas ${result.imported} carreras${result.errors ? `, ${result.errors} errores` : ''}`)
      refresh()
    } catch {
      setImportMsg('Error al importar CSV')
    }
    setTimeout(() => setImportMsg(''), 4000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-indigo-600 text-white px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>

      <div className="flex flex-col gap-4 p-4">

        {/* Destinations */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-indigo-500" />
              <p className="text-sm font-bold text-gray-800">{t('destinos')}</p>
            </div>
            <button onClick={() => { setEditDest(null); setShowAddDest(true) }} className="flex items-center gap-1 text-indigo-600 font-semibold text-sm">
              <Plus size={14} /> {t('nuevoDestino')}
            </button>
          </div>
          {destinations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin destinos. Añade el primero.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {destinations.map(dest => (
                <button
                  key={dest.id}
                  onClick={() => { setEditDest(dest); setShowAddDest(true) }}
                  className="px-3 py-2 rounded-xl text-white text-sm font-semibold active:scale-95 transition-transform"
                  style={{ backgroundColor: dest.color }}
                >
                  {dest.name}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Expenses */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-indigo-500" />
              <p className="text-sm font-bold text-gray-800">{t('gastos')}</p>
            </div>
            <button onClick={() => setShowAddExpense(true)} className="flex items-center gap-1 text-indigo-600 font-semibold text-sm">
              <Plus size={14} /> {t('nuevoGasto')}
            </button>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">Sin gastos registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.slice(0, 10).map(exp => (
                <div key={exp.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{exp.category}{exp.description ? ` · ${exp.description}` : ''}</p>
                    <p className="text-xs text-gray-400">{exp.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold text-sm">{formatEurosShort(exp.amountCents)}</span>
                    <button onClick={async () => { await deleteExpense(exp.id!); refresh() }}>
                      <X size={14} className="text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Odometer history */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={16} className="text-indigo-500" />
            <p className="text-sm font-bold text-gray-800">{t('historialKm')}</p>
          </div>
          {odometer.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">Sin lecturas de odómetro</p>
          ) : (
            <div className="flex flex-col gap-2">
              {odometer.slice(0, 8).map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{r.kmValue.toLocaleString('es-ES')} km</p>
                    <p className="text-xs text-gray-400">{formatDateTime(r.readAt)} · {r.type} · {r.source}</p>
                  </div>
                  <button onClick={async () => { await deleteOdometerReading(r.id!); refresh() }}>
                    <X size={14} className="text-gray-300 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Export / Import */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Download size={16} className="text-indigo-500" />
            <p className="text-sm font-bold text-gray-800">{t('exportar')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={exportRidesCSV}>{t('carrerasCSV')}</Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={exportExpensesCSV}>{t('gastosCSV')}</Button>
            </div>
            <Button variant="secondary" size="sm" onClick={exportJSONBackup} className="w-full">
              {t('backupJSON')}
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-2 mb-3">
            <Upload size={16} className="text-indigo-500" />
            <p className="text-sm font-bold text-gray-800">{t('importar')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" className="w-full" onClick={() => jsonInputRef.current?.click()}>
              {t('restaurarJSON')}
            </Button>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => csvInputRef.current?.click()}>
              {t('importarCSV')}
            </Button>
            <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJSONImport} />
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </div>
          {importMsg && (
            <p className="mt-3 text-sm text-center text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">{importMsg}</p>
          )}
        </Card>

        {/* Language */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages size={16} className="text-indigo-500" />
              <p className="text-sm font-bold text-gray-800">{t('idioma')}</p>
            </div>
            <button
              onClick={handleLocaleToggle}
              className="flex items-center gap-1 bg-indigo-50 text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform"
            >
              {locale === 'es' ? '🇪🇸 Español' : '🏝️ Català'}
            </button>
          </div>
        </Card>

        {/* Biometrics */}
        {bioAvailable && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint size={16} className="text-indigo-500" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{t('biometria')}</p>
                  <p className="text-xs text-gray-400">{hasBiometric ? t('biometriaActiva') : t('biometriaInactiva')}</p>
                </div>
              </div>
              <button
                onClick={handleBiometricToggle}
                className={`text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform ${
                  hasBiometric
                    ? 'bg-red-50 text-red-600'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {hasBiometric ? t('desactivarBiometria') : t('activarBiometria')}
              </button>
            </div>
          </Card>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 text-sm font-medium"
        >
          <LogOut size={16} />
          {t('cerrarSesion')}
        </button>

        {/* Danger */}
        <button
          onClick={handleDeleteAll}
          className="flex items-center justify-center gap-2 w-full py-3 text-red-500 text-sm font-medium"
        >
          <Trash2 size={16} />
          {t('borrarDatos')}
        </button>
      </div>

      <DestinationModal isOpen={showAddDest} existing={editDest} onClose={() => setShowAddDest(false)} onSaved={refresh} />
      <ExpenseModal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} onSaved={refresh} />
    </div>
  )
}

/* ---- Destination Modal ---- */
function DestinationModal({ isOpen, existing, onClose, onSaved }: {
  isOpen: boolean; existing: Destination | null; onClose: () => void; onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DESTINATION_COLORS[0])

  useEffect(() => {
    if (isOpen) { setName(existing?.name ?? ''); setColor(existing?.color ?? DESTINATION_COLORS[0]) }
  }, [isOpen, existing])

  const handleSave = async () => {
    if (!name.trim()) return
    if (existing?.id) await updateDestination(existing.id, { name: name.trim(), color })
    else await addDestination(name.trim(), color)
    onSaved(); onClose()
  }

  const handleArchive = async () => {
    if (!existing?.id) return
    if (!confirm(`¿Archivar "${existing.name}"?`)) return
    await toggleDestination(existing.id, false)
    onSaved(); onClose()
  }

  const handleDelete = async () => {
    if (!existing?.id) return
    if (!confirm(`¿Eliminar permanentemente "${existing.name}"? No se puede deshacer.`)) return
    await deleteDestination(existing.id)
    onSaved(); onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Editar destino' : 'Nuevo destino'}>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nombre</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Aeropuerto, Centro..."
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Color</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DESTINATION_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className="w-9 h-9 rounded-full transition-all active:scale-95"
                style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={!name.trim()} className="w-full" size="lg">
          {existing ? 'Guardar cambios' : 'Crear destino'}
        </Button>
        {existing && (
          <>
            <Button variant="ghost" onClick={handleArchive} className="w-full text-amber-500">Archivar destino</Button>
            <Button variant="ghost" onClick={handleDelete} className="w-full text-red-500">Eliminar destino</Button>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ---- Expense Modal ---- */
function ExpenseModal({ isOpen, onClose, onSaved }: { isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Expense['category']>('gasolina')
  const [description, setDescription] = useState('')

  const handleSave = async () => {
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (!cents || cents <= 0) return
    await addExpense({ amountCents: cents, category, description: description.trim() || undefined, date: new Date().toISOString().slice(0, 10) })
    setAmount(''); setDescription('')
    onSaved(); onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo gasto">
      <div className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Categoría</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value as Expense['category'])}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${category === cat.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Importe (€)</label>
          <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="45.00"
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Descripción (opcional)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Gasolinera Repsol..."
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <Button onClick={handleSave} disabled={!amount} className="w-full" size="lg">Guardar gasto</Button>
      </div>
    </Modal>
  )
}
