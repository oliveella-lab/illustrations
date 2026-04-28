import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { supabase } from '@/lib/supabase'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predictionId } = await params
    const prediction = await replicate.predictions.get(predictionId)

    if (prediction.status === 'succeeded') {
      const output = prediction.output
      const imageUrl = Array.isArray(output) ? String(output[0]) : String(output)

      // Update Supabase with final image URL
      await supabase
        .from('generations')
        .update({ image_url: imageUrl, status: 'succeeded' })
        .eq('prediction_id', predictionId)

      return NextResponse.json({ status: 'succeeded', imageUrl })
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return NextResponse.json({ status: 'failed', error: 'האימון נכשל' })
    }

    return NextResponse.json({ status: prediction.status })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה בבדיקת סטטוס' }, { status: 500 })
  }
}
