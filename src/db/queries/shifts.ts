import { db, type Shift } from '../schema'

const now = () => new Date().toISOString()

export async function startShift(startKm?: number): Promise<number> {
  return db.shifts.add({ startAt: now(), startKm, updatedAt: now(), synced: 0 })
}

export async function endShift(id: number, endKm?: number): Promise<void> {
  await db.shifts.update(id, { endAt: now(), endKm, updatedAt: now(), synced: 0 })
}

export async function getActiveShift(): Promise<Shift | undefined> {
  const all = await db.shifts.toArray()
  return all.find(s => !s.endAt)
}

export async function getShifts(limit = 30): Promise<Shift[]> {
  return db.shifts.orderBy('startAt').reverse().limit(limit).toArray()
}
