import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { supabase } from '@/lib/supabase'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

export async function POST() {
  try {
    const { data: approved, error } = await supabase
      .from('generations')
      .select('image_url')
      .eq('approved', true)

    if (error) throw error
    if (!approved || approved.length === 0) {
      return NextResponse.json({ error: 'אין תמונות מאושרות לאימון' }, { status: 400 })
    }

    const training = await replicate.trainings.create(
      'ostris',
      'flux-dev-lora-trainer',
      'latest',
      {
        destination: `oliveella-lab/illustration-style` as `${string}/${string}`,
        input: {
          input_images: process.env.ORIGINAL_TRAINING_ZIP_URL!,
          trigger_word: 'ILSTYLE',
          steps: 1000,
        },
      }
    )

    return NextResponse.json({
      ok: true,
      trainingId: training.id,
      approvedCount: approved.length,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה בהפעלת אימון' }, { status: 500 })
  }
}
