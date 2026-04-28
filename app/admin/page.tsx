'use client'

import { useState, useEffect, useCallback } from 'react'

type Generation = {
  id: string
  description: string
  image_url: string
  approved: boolean | null
  created_at: string
}

export default function AdminPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [retrainResult, setRetrainResult] = useState<string | null>(null)

  const fetchGenerations = useCallback(async () => {
    const res = await fetch('/api/admin/generations')
    const data = await res.json()
    setGenerations(data.generations || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGenerations() }, [fetchGenerations])

  async function retrain() {
    setRetraining(true)
    setRetrainResult(null)
    try {
      const res = await fetch('/api/retrain', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setRetrainResult(`האימון התחיל! ${data.approvedCount} תמונות מאושרות נשלחו.`)
      } else {
        setRetrainResult(data.error || 'שגיאה')
      }
    } finally {
      setRetraining(false)
    }
  }

  const approved = generations.filter(g => g.approved === true)
  const rejected = generations.filter(g => g.approved === false)
  const pending = generations.filter(g => g.approved === null)

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול איורים</h1>
            <p className="text-gray-500 text-sm mt-1">
              {approved.length} מאושרים · {rejected.length} נדחו · {pending.length} ממתינים
            </p>
          </div>
          <button
            onClick={retrain}
            disabled={retraining || approved.length === 0}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {retraining ? 'מאמן...' : `אמן מחדש (${approved.length} תמונות)`}
          </button>
        </div>

        {retrainResult && (
          <div className="mb-6 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            {retrainResult}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">טוען...</div>
        ) : generations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">עדיין אין איורים</div>
        ) : (
          <div>
            {approved.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4">✓ מאושרים</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {approved.map(g => <ImageCard key={g.id} generation={g} onUpdate={fetchGenerations} />)}
                </div>
              </section>
            )}
            {pending.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">ממתינים לפידבק</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pending.map(g => <ImageCard key={g.id} generation={g} onUpdate={fetchGenerations} />)}
                </div>
              </section>
            )}
            {rejected.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">✗ נדחו</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {rejected.map(g => <ImageCard key={g.id} generation={g} onUpdate={fetchGenerations} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function ImageCard({ generation, onUpdate }: { generation: Generation; onUpdate: () => void }) {
  async function updateFeedback(approved: boolean | null) {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generation.id, approved }),
    })
    onUpdate()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-gray-50 flex items-center justify-center p-4 h-36">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={generation.image_url} alt={generation.description} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="p-2">
        <p className="text-xs text-gray-600 truncate mb-2">{generation.description}</p>
        <div className="flex gap-1">
          <button
            onClick={() => updateFeedback(true)}
            className={`flex-1 text-xs py-1 rounded-lg transition-colors ${generation.approved === true ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-500 hover:bg-green-50'}`}
          >✓</button>
          <button
            onClick={() => updateFeedback(false)}
            className={`flex-1 text-xs py-1 rounded-lg transition-colors ${generation.approved === false ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-500 hover:bg-red-50'}`}
          >✗</button>
        </div>
      </div>
    </div>
  )
}
