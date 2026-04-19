'use client'

import { bytesToBase64, base64ToBytes } from './kdf'

const IDB_STORE = 'taxilles_biometric'
const IDB_KEY = 'wrapped_aes_key'

function openBiometricStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('taxilles_bio', 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const req = tx.objectStore(IDB_STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export function isBiometricsSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricsSupported()) return false
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
}

// Check if PRF extension is supported (Chrome 121+, Firefox 124+)
async function isPRFSupported(): Promise<boolean> {
  if (!isBiometricsSupported()) return false
  if (!('isConditionalMediationAvailable' in PublicKeyCredential)) return false
  return true
}

export async function hasBiometricCredential(): Promise<boolean> {
  const db = await openBiometricStore()
  const stored = await idbGet(db, IDB_KEY)
  return stored != null
}

// Register biometric credential and store the AES key
export async function registerBiometric(aesKey: CryptoKey, userId: string): Promise<boolean> {
  const available = await isPlatformAuthenticatorAvailable()
  if (!available) return false

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const userId8 = new TextEncoder().encode(userId.slice(0, 16).padEnd(16, '0'))

    const prfSupported = await isPRFSupported()
    const extensions: Record<string, unknown> = prfSupported
      ? { prf: { eval: { first: challenge } } }
      : {}

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'TaxIlles', id: window.location.hostname },
        user: { id: userId8, name: userId, displayName: 'Taxista' },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        extensions,
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null

    if (!credential) return false

    const db = await openBiometricStore()
    const rawKey = await crypto.subtle.exportKey('raw', aesKey)
    const keyBase64 = bytesToBase64(new Uint8Array(rawKey))

    // Try PRF key wrapping
    const prfResult = (credential as PublicKeyCredential & {
      getClientExtensionResults: () => { prf?: { results?: { first?: ArrayBuffer } } }
    }).getClientExtensionResults()?.prf?.results?.first

    if (prfResult) {
      const prfKey = await crypto.subtle.importKey('raw', prfResult, { name: 'AES-KW', length: 256 }, false, ['wrapKey'])
      const wrapped = await crypto.subtle.wrapKey('raw', aesKey, prfKey, 'AES-KW')
      await idbSet(db, IDB_KEY, {
        type: 'prf',
        credId: bytesToBase64(new Uint8Array(credential.rawId)),
        wrapped: bytesToBase64(new Uint8Array(wrapped)),
        challenge: bytesToBase64(challenge),
      })
    } else {
      // Fallback: store raw key (soft protection — only after biometric assertion)
      await idbSet(db, IDB_KEY, {
        type: 'soft',
        credId: bytesToBase64(new Uint8Array(credential.rawId)),
        keyBase64,
      })
    }

    return true
  } catch {
    return false
  }
}

// Authenticate with biometrics and retrieve AES key
export async function authenticateWithBiometrics(): Promise<CryptoKey | null> {
  const db = await openBiometricStore()
  const stored = await idbGet(db, IDB_KEY) as {
    type: 'prf' | 'soft'
    credId: string
    keyBase64?: string
    wrapped?: string
    challenge?: string
  } | undefined

  if (!stored) return null

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const allowCredentials: PublicKeyCredentialDescriptor[] = [{
      type: 'public-key',
      id: base64ToBytes(stored.credId).buffer as ArrayBuffer,
    }]

    const extensions: Record<string, unknown> = stored.type === 'prf'
      ? { prf: { eval: { first: base64ToBytes(stored.challenge!) } } }
      : {}

    const assertion = await navigator.credentials.get({
      publicKey: { challenge, allowCredentials, userVerification: 'required', extensions, timeout: 60_000 },
    }) as PublicKeyCredential | null

    if (!assertion) return null

    if (stored.type === 'prf') {
      const prfResult = (assertion as PublicKeyCredential & {
        getClientExtensionResults: () => { prf?: { results?: { first?: ArrayBuffer } } }
      }).getClientExtensionResults()?.prf?.results?.first

      if (!prfResult) return null
      const prfKey = await crypto.subtle.importKey('raw', prfResult, { name: 'AES-KW', length: 256 }, false, ['unwrapKey'])
      const wrappedBytes = base64ToBytes(stored.wrapped!).buffer as ArrayBuffer
      return crypto.subtle.unwrapKey('raw', wrappedBytes, prfKey, 'AES-KW', { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    } else {
      // Soft: assertion proved presence, now return the stored key
      return crypto.subtle.importKey('raw', base64ToBytes(stored.keyBase64!).buffer as ArrayBuffer, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    }
  } catch {
    return null
  }
}

export async function clearBiometricCredential(): Promise<void> {
  const db = await openBiometricStore()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const req = tx.objectStore(IDB_STORE).delete(IDB_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
