import { getSupabaseClient } from './client'
import { encryptData, decryptData } from '@/lib/crypto/aes'

type TableName = 'destinations' | 'rides' | 'odometer_readings' | 'shifts' | 'expenses'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tbl = (name: TableName) => getSupabaseClient().from(name) as any

export interface RemoteRow {
  supabaseId: string
  updatedAt: string
  data: unknown
  ridden_at?: string
  read_at?: string
  started_at?: string
  ended_at?: string
  expense_date?: string
}

export async function upsertEncrypted(
  tableName: TableName,
  supabaseId: string | undefined,
  plainData: unknown,
  timestamps: Record<string, string>,
  key: CryptoKey
): Promise<string> {
  const encrypted_data = await encryptData(key, plainData)
  const { data: { user } } = await getSupabaseClient().auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload = { user_id: user.id, encrypted_data, ...timestamps, updated_at: new Date().toISOString() }

  if (supabaseId) {
    const { data, error } = await tbl(tableName).update(payload).eq('id', supabaseId).select('id').single()
    if (error) throw error
    return data.id as string
  } else {
    const { data, error } = await tbl(tableName).insert(payload).select('id').single()
    if (error) throw error
    return data.id as string
  }
}

export async function fetchAllEncrypted(tableName: TableName, key: CryptoKey): Promise<RemoteRow[]> {
  const { data, error } = await tbl(tableName).select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return Promise.all((data as Record<string, string>[]).map(async (row): Promise<RemoteRow> => ({
    supabaseId: row.id,
    updatedAt: row.updated_at,
    data: await decryptData(key, row.encrypted_data),
    ridden_at: row.ridden_at,
    read_at: row.read_at,
    started_at: row.started_at,
    ended_at: row.ended_at,
    expense_date: row.expense_date,
  })))
}

export async function deleteEncrypted(tableName: TableName, supabaseId: string): Promise<void> {
  const { error } = await tbl(tableName).delete().eq('id', supabaseId)
  if (error) throw error
}

export async function fetchUserConfig(): Promise<{ kdf_salt: string; preferred_language: string } | null> {
  const { data } = await tbl('user_config' as TableName).select('kdf_salt, preferred_language').single()
  return data
}

export async function upsertUserConfig(userId: string, kdfSalt: string, language = 'es'): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseClient().from('user_config') as any).upsert({
    user_id: userId,
    kdf_salt: kdfSalt,
    preferred_language: language,
  })
  if (error) throw error
}

export async function deleteAllUserData(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const tables: TableName[] = ['rides', 'odometer_readings', 'shifts', 'expenses', 'destinations']
  await Promise.all(tables.map(t =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from(t) as any).delete().eq('user_id', user.id)
  ))
}
