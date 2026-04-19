import { db } from '@/db/schema'
import { upsertEncrypted, fetchAllEncrypted, type RemoteRow } from '@/lib/supabase/queries'

const LAST_SYNC_KEY = 'taxilles_last_sync'

export function setLastSync() {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
}

async function pushPending(key: CryptoKey) {
  const unsyncedDest = await db.destinations.where('synced').equals(0).toArray()
  for (const d of unsyncedDest) {
    const { id, supabaseId, synced: _s, updatedAt: _u, ...plain } = d
    const sid = await upsertEncrypted('destinations', supabaseId, plain, {}, key)
    await db.destinations.update(id!, { supabaseId: sid, synced: 1 })
  }

  const unsyncedRides = await db.rides.where('synced').equals(0).toArray()
  for (const r of unsyncedRides) {
    const { id, supabaseId, synced: _s, updatedAt: _u, riddenAt, ...plain } = r
    const sid = await upsertEncrypted('rides', supabaseId, plain, { ridden_at: riddenAt }, key)
    await db.rides.update(id!, { supabaseId: sid, synced: 1 })
  }

  const unsyncedOdo = await db.odometer.where('synced').equals(0).toArray()
  for (const o of unsyncedOdo) {
    const { id, supabaseId, synced: _s, updatedAt: _u, readAt, ...plain } = o
    const sid = await upsertEncrypted('odometer_readings', supabaseId, plain, { read_at: readAt }, key)
    await db.odometer.update(id!, { supabaseId: sid, synced: 1 })
  }

  const unsyncedShifts = await db.shifts.where('synced').equals(0).toArray()
  for (const s of unsyncedShifts) {
    const { id, supabaseId, synced: _s, updatedAt: _u, startAt, endAt, ...plain } = s
    const ts: Record<string, string> = { started_at: startAt }
    if (endAt) ts.ended_at = endAt
    const sid = await upsertEncrypted('shifts', supabaseId, plain, ts, key)
    await db.shifts.update(id!, { supabaseId: sid, synced: 1 })
  }

  const unsyncedExp = await db.expenses.where('synced').equals(0).toArray()
  for (const e of unsyncedExp) {
    const { id, supabaseId, synced: _s, updatedAt: _u, date, ...plain } = e
    const sid = await upsertEncrypted('expenses', supabaseId, plain, { expense_date: date }, key)
    await db.expenses.update(id!, { supabaseId: sid, synced: 1 })
  }
}

async function upsertLocal<T extends object>(
  collection: typeof db.destinations | typeof db.rides | typeof db.odometer | typeof db.shifts | typeof db.expenses,
  row: RemoteRow,
  extra: T
) {
  const existing = await collection.where('supabaseId').equals(row.supabaseId).first()
  const plain = row.data as Record<string, unknown>
  const record = { ...plain, ...extra, supabaseId: row.supabaseId, synced: 1, updatedAt: row.updatedAt }

  if (!existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (collection as any).add(record)
  } else if (row.updatedAt > (existing.updatedAt ?? '')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (collection as any).update(existing.id!, record)
  }
}

async function pullRemote(key: CryptoKey) {
  const now = new Date().toISOString()

  const remoteDest = await fetchAllEncrypted('destinations', key)
  for (const row of remoteDest) {
    await upsertLocal(db.destinations, row, {})
  }

  const remoteRides = await fetchAllEncrypted('rides', key)
  for (const row of remoteRides) {
    await upsertLocal(db.rides, row, { riddenAt: row.ridden_at ?? now })
  }

  const remoteOdo = await fetchAllEncrypted('odometer_readings', key)
  for (const row of remoteOdo) {
    await upsertLocal(db.odometer, row, { readAt: row.read_at ?? now })
  }

  const remoteShifts = await fetchAllEncrypted('shifts', key)
  for (const row of remoteShifts) {
    await upsertLocal(db.shifts, row, { startAt: row.started_at ?? now, endAt: row.ended_at })
  }

  const remoteExp = await fetchAllEncrypted('expenses', key)
  for (const row of remoteExp) {
    await upsertLocal(db.expenses, row, { date: row.expense_date ?? now.slice(0, 10) })
  }
}

export async function runSync(key: CryptoKey): Promise<void> {
  if (!navigator.onLine) return
  try {
    await pushPending(key)
    await pullRemote(key)
    setLastSync()
  } catch (err) {
    console.warn('Sync failed:', err)
  }
}
