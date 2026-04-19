import { db, type Shift } from '../schema'

export async function startShift(startKm?: number): Promise<number> {
  return db.shifts.add({ startAt: new Date().toISOString(), startKm })
}

export async function endShift(id: number, endKm?: number): Promise<void> {
  await db.shifts.update(id, { endAt: new Date().toISOString(), endKm })
}

export async function getActiveShift(): Promise<Shift | undefined> {
  const all = await db.shifts.toArray()
  return all.find(s => !s.endAt)
}

export async function getShifts(limit = 30): Promise<Shift[]> {
  return db.shifts.orderBy('startAt').reverse().limit(limit).toArray()
}
