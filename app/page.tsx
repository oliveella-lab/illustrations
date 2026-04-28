'use client'

import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [predictionId, setPredictionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('מייצר פרומפט...')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!predictionId) return
    setLoadingMsg('יוצר איור...')

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${predictionId}`)
        const data = await res.json()

        if (data.status === 'succeeded') {
          clearInterval(pollRef.current!)
          setPredictionId(null)
          setImageUrl(data.imageUrl)
          setLoading(false)
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!)
          setPredictionId(null)
          setError('היצירה נכשלה, נסי שוב')
          setLoading(false)
        }
      } catch {
        clearInterval(pollRef.current!)
        setError('שגיאה בחיבור לשרת')
        setLoading(false)
      }
    }, 3000)

    return () => clearInterval(pollRef.current!)
  }, [predictionId])

  async function generate() {
    if (!description.trim()) return
    setLoading(true)
    setImageUrl(null)
    setEnhancedPrompt(null)
    setGenerationId(null)
    setPredictionId(null)
    setFeedbackSent(false)
    setError(null)
    setLoadingMsg('מייצר פרומפט...')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה ביצירת האיור')
      setEnhancedPrompt(data.enhancedPrompt)
      setGenerationId(data.id)
      setPredictionId(data.predictionId)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה')
      setLoading(false)
    }
  }

  async function sendFeedback(approved: boolean) {
    if (!generationId) return
    setFeedbackSent(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generationId, approved }),
    })
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">סוכן האיורים</h1>
        <p className="text-gray-500 text-center mb-10 text-sm">תאר מה לאייר — הסוכן ייצור איור בסגנון המותג</p>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && generate()}
            placeholder="לדוגמה: בקבוק בירה, מעטפה, עץ..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-gray-600 bg-white"
            disabled={loading}
          />
          <button
            onClick={generate}
            disabled={loading || !description.trim()}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {loading ? '...' : 'צור'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">{loadingMsg}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}

        {imageUrl && !loading && (
          <div className="flex flex-col items-center gap-6">
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-gray-50 w-full flex items-center justify-center p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={description} className="max-w-full max-h-80 object-contain" />
            </div>

            {!feedbackSent ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-sm text-gray-600">האם האיור מתאים לסגנון?</p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => sendFeedback(true)}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-xl py-3 text-sm font-medium transition-colors"
                  >
                    ✓ כן, מתאים לסגנון
                  </button>
                  <button
                    onClick={() => sendFeedback(false)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl py-3 text-sm font-medium transition-colors"
                  >
                    ✗ לא מתאים
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">תודה על הפידבק!</p>
            )}

            {enhancedPrompt && (
              <details className="w-full text-xs text-gray-400">
                <summary className="cursor-pointer">הפרומפט שנוצר</summary>
                <p className="mt-2 bg-gray-50 rounded-lg p-3 leading-relaxed" dir="ltr">{enhancedPrompt}</p>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
