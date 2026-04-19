import Dexie, { type Table } from 'dexie'

export interface Destination {
  id?: number
  name: string
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  supabaseId?: string
  synced: number // 0=pending, 1=synced
}

export interface Ride {
  id?: number
  destinationId: number
  destinationName: string
  destinationColor: string
  priceCents: number
  riddenAt: string
  kmGps?: number
  notes?: string
  updatedAt: string
  supabaseId?: string
  synced: number
}

export interface OdometerReading {
  id?: number
  kmValue: number
  type: 'start' | 'end' | 'manual'
  source: 'ocr' | 'manual'
  photoUri?: string
  readAt: string
  notes?: string
  updatedAt: string
  supabaseId?: string
  synced: number
}

export interface Shift {
  id?: number
  startAt: string
  endAt?: string
  startKm?: number
  endKm?: number
  updatedAt: string
  supabaseId?: string
  synced: number
}

export interface Expense {
  id?: number
  amountCents: number
  category: 'gasolina' | 'itv' | 'mantenimiento' | 'seguro' | 'otro'
  description?: string
  date: string
  updatedAt: string
  supabaseId?: string
  synced: number
}

class TaxIllesDB extends Dexie {
  destinations!: Table<Destination>
  rides!: Table<Ride>
  odometer!: Table<OdometerReading>
  shifts!: Table<Shift>
  expenses!: Table<Expense>

  constructor() {
    super('taxilles')
    // v1: original schema
    this.version(1).stores({
      destinations: '++id, name, isActive, createdAt',
      rides: '++id, destinationId, riddenAt, [riddenAt+destinationId]',
      odometer: '++id, readAt, type',
      shifts: '++id, startAt, endAt',
      expenses: '++id, date, category',
    })
    // v2: add sync fields (upgrade fills defaults)
    this.version(2).stores({
      destinations: '++id, name, isActive, createdAt, supabaseId, synced',
      rides: '++id, destinationId, riddenAt, [riddenAt+destinationId], supabaseId, synced',
      odometer: '++id, readAt, type, supabaseId, synced',
      shifts: '++id, startAt, endAt, supabaseId, synced',
      expenses: '++id, date, category, supabaseId, synced',
    }).upgrade(tx => {
      const now = new Date().toISOString()
      const fill = (table: string) =>
        tx.table(table).toCollection().modify((rec: Record<string, unknown>) => {
          if (!rec.updatedAt) rec.updatedAt = rec.createdAt ?? now
          if (rec.synced === undefined) rec.synced = 0
        })
      return Promise.all(['destinations', 'rides', 'odometer', 'shifts', 'expenses'].map(fill))
    })
  }
}

export const db = new TaxIllesDB()

export const DESTINATION_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#84cc16',
]

export const EXPENSE_CATEGORIES = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'itv', label: 'ITV' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'otro', label: 'Otro' },
] as const
