import Dexie, { type Table } from 'dexie'

export interface Destination {
  id?: number
  name: string
  color: string
  isActive: boolean
  createdAt: string
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
}

export interface OdometerReading {
  id?: number
  kmValue: number
  type: 'start' | 'end' | 'manual'
  source: 'ocr' | 'manual'
  photoUri?: string
  readAt: string
  notes?: string
}

export interface Shift {
  id?: number
  startAt: string
  endAt?: string
  startKm?: number
  endKm?: number
}

export interface Expense {
  id?: number
  amountCents: number
  category: 'gasolina' | 'itv' | 'mantenimiento' | 'seguro' | 'otro'
  description?: string
  date: string
}

class TaxIllesDB extends Dexie {
  destinations!: Table<Destination>
  rides!: Table<Ride>
  odometer!: Table<OdometerReading>
  shifts!: Table<Shift>
  expenses!: Table<Expense>

  constructor() {
    super('taxilles')
    this.version(1).stores({
      destinations: '++id, name, isActive, createdAt',
      rides: '++id, destinationId, riddenAt, [riddenAt+destinationId]',
      odometer: '++id, readAt, type',
      shifts: '++id, startAt, endAt',
      expenses: '++id, date, category',
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
