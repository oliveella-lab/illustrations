import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('id, description, image_url, approved, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ generations: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה בטעינת הנתונים' }, { status: 500 })
  }
}
