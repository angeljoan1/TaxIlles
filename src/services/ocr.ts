'use client'

export interface OcrResult {
  extractedKm: number | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  rawText: string
  allCandidates: number[]
}

export async function recognizeOdometerText(imageUri: string, previousReading?: number): Promise<OcrResult> {
  // Dynamic import to avoid SSR issues
  const Tesseract = (await import('tesseract.js')).default

  const result = await Tesseract.recognize(imageUri, 'eng', {
    logger: () => {},
  })

  const rawText = result.data.text
  return extractKilometers(rawText, previousReading)
}

function extractKilometers(text: string, previousReading?: number): OcrResult {
  // Matches formats: 143521, 143.521, 143,521, 143 521
  const regex = /\b(\d{1,3}(?:[.,\s]?\d{3})*)\b/g
  const matches = [...text.matchAll(regex)]

  const candidates: number[] = []
  for (const m of matches) {
    const cleaned = m[1].replace(/[.,\s]/g, '')
    const num = parseInt(cleaned, 10)
    if (num >= 1000 && num <= 9999999) {
      candidates.push(num)
    }
  }

  // Score: prefer 5-7 digit numbers (typical odometer), and > previous reading
  const scored = candidates.map(n => {
    const digits = n.toString().length
    let score = digits >= 5 && digits <= 7 ? 2 : 1
    if (previousReading && n > previousReading) score += 1
    return { n, score }
  }).sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { extractedKm: null, confidence: 'none', rawText: text, allCandidates: candidates }

  const best = scored[0]
  const confidence = best.score >= 3 ? 'high' : best.score === 2 ? 'medium' : 'low'
  return { extractedKm: best.n, confidence, rawText: text, allCandidates: candidates }
}
