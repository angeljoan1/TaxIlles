import { db, type Destination } from '../schema'

const now = () => new Date().toISOString()

export async function getActiveDestinations(): Promise<Destination[]> {
  const all = await db.destinations.orderBy('name').toArray()
  return all.filter(d => d.isActive)
}

export async function getAllDestinations(): Promise<Destination[]> {
  return db.destinations.orderBy('name').toArray()
}

export async function addDestination(name: string, color: string): Promise<number> {
  return db.destinations.add({ name: name.trim(), color, isActive: true, createdAt: now(), updatedAt: now(), synced: 0 })
}

export async function updateDestination(id: number, data: Partial<Destination>): Promise<void> {
  await db.destinations.update(id, { ...data, updatedAt: now(), synced: 0 })
}

export async function toggleDestination(id: number, isActive: boolean): Promise<void> {
  await db.destinations.update(id, { isActive, updatedAt: now(), synced: 0 })
}

export async function deleteDestination(id: number): Promise<void> {
  await db.destinations.delete(id)
}
