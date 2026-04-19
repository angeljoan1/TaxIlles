'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { getActiveDestinations, addDestination, toggleDestination, updateDestination } from '@/db/queries/destinations'
import { getExpenses, addExpense, deleteExpense } from '@/db/queries/expenses'
import { getOdometerReadings, deleteOdometerReading } from '@/db/queries/odometer'
import { type Destination, type Expense, type OdometerReading, DESTINATION_COLORS, EXPENSE_CATEGORIES } from '@/db/schema'
import { exportRidesCSV, exportExpensesCSV } from '@/services/export'
import { formatEuros, formatEurosShort } from '@/utils/currency'
import { formatDateTime } from '@/utils/date'
import { db } from '@/db/schema'

export default function AjustesPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [odometer, setOdometer] = useState<OdometerReading[]>([])
  const [showAddDest, setShowAddDest] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editDest, setEditDest] = useState<Destination | null>(null)

  const refresh = useCallback(async () => {
    const [d, e, o] = await Promise.all([
      getActiveDestinations(),
      getExpenses(),
      getOdometerReadings(),
    ])
    setDestinations(d)
    setExpenses(e)
    setOdometer(o)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDeleteAll = async () => {
    if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return
    if (!confirm('¿Seguro? Se perderán todas las carreras, gastos y km.')) return
    await db.rides.clear()
    await db.odometer.clear()
    await db.expenses.clear()
    await db.shifts.clear()
    refresh()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-indigo-600 text-white px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold">Ajustes</h1>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Destinations */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">📍 Mis Destinos</p>
            <button onClick={() => { setEditDest(null); setShowAddDest(true) }} className="text-indigo-600 font-semibold text-sm">+ Añadir</button>
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
            <p className="text-sm font-bold text-gray-800">💸 Gastos</p>
            <button onClick={() => setShowAddExpense(true)} className="text-indigo-600 font-semibold text-sm">+ Añadir</button>
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
                    <button onClick={async () => { await deleteExpense(exp.id!); refresh() }} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Odometer history */}
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-3">🔢 Historial km</p>
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
                  <button onClick={async () => { await deleteOdometerReading(r.id!); refresh() }} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Export */}
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-3">📤 Exportar datos</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={exportRidesCSV}>Carreras CSV</Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={exportExpensesCSV}>Gastos CSV</Button>
          </div>
        </Card>

        {/* Danger zone */}
        <Button variant="danger" onClick={handleDeleteAll}>🗑️ Borrar todos los datos</Button>
      </div>

      <DestinationModal
        isOpen={showAddDest}
        existing={editDest}
        onClose={() => setShowAddDest(false)}
        onSaved={refresh}
      />
      <ExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSaved={refresh}
      />
    </div>
  )
}

/* ---- Destination Modal ---- */
function DestinationModal({ isOpen, existing, onClose, onSaved }: {
  isOpen: boolean; existing: Destination | null
  onClose: () => void; onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DESTINATION_COLORS[0])

  useEffect(() => {
    if (isOpen) {
      setName(existing?.name ?? '')
      setColor(existing?.color ?? DESTINATION_COLORS[0])
    }
  }, [isOpen, existing])

  const handleSave = async () => {
    if (!name.trim()) return
    if (existing?.id) {
      await updateDestination(existing.id, { name: name.trim(), color })
    } else {
      await addDestination(name.trim(), color)
    }
    onSaved()
    onClose()
  }

  const handleArchive = async () => {
    if (!existing?.id) return
    if (!confirm(`¿Archivar "${existing.name}"? Ya no aparecerá en el selector.`)) return
    await toggleDestination(existing.id, false)
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Editar destino' : 'Nuevo destino'}>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Nombre</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Aeropuerto, Centro..."
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Color</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DESTINATION_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-full transition-all active:scale-95"
                style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
              />
            ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={!name.trim()} className="w-full" size="lg">
          {existing ? 'Guardar cambios' : 'Crear destino'}
        </Button>
        {existing && (
          <Button variant="ghost" onClick={handleArchive} className="w-full text-red-400">
            Archivar destino
          </Button>
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
    setAmount('')
    setDescription('')
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo gasto">
      <div className="flex flex-col gap-4 p-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Categoría</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value as Expense['category'])}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${category === cat.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Importe (€)</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="45.00"
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Descripción (opcional)</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Gasolinera Repsol..."
            className="mt-1 w-full py-3 px-4 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <Button onClick={handleSave} disabled={!amount} className="w-full" size="lg">Guardar gasto</Button>
      </div>
    </Modal>
  )
}
