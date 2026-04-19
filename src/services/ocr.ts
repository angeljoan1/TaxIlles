'use client'

export interface OcrResult {
  extractedKm: number | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  rawText: string
  allCandidates: number[]
}

export async function recognizeOdometerText(imageUri: string, previousReading?: number): Promise<OcrResult> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: () => {},
    errorHandler: () => {},
  })
  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.',
    })
    const { data } = await worker.recognize(imageUri)
    return extractKilometers(data.text, previousReading)
  } finally {
    await worker.terminate()
  }
}

function extractKilometers(text: string, previousReading?: number): OcrResult {
  // Match sequences of digits (with optional separators: . , space)
  const regex = /\d[\d.,\s]*/g
  const matches = text.match(regex) ?? []

  const candidates: number[] = []
  for (const m of matches) {
    const cleaned = m.replace(/[.,\s]/g, '')
    const num = parseInt(cleaned, 10)
    if (num >= 100 && num <= 9_999_999) {
      candidates.push(num)
    }
  }

  if (candidates.length === 0) {
    return { extractedKm: null, confidence: 'none', rawText: text, allCandidates: [] }
  }

  // Score: prefer 5-7 digit numbers (typical odometer), and > previous reading
  const scored = candidates.map(n => {
    const digits = n.toString().length
    let score = digits >= 5 && digits <= 7 ? 2 : 1
    if (previousReading && n > previousReading) score += 1
    return { n, score }
  }).sort((a, b) => b.score - a.score)

  const best = scored[0]
  const confidence = best.score >= 3 ? 'high' : best.score === 2 ? 'medium' : 'low'
  return { extractedKm: best.n, confidence, rawText: text, allCandidates: candidates }
}
