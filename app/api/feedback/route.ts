import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, approved } = await req.json()
    if (!id) return NextResponse.json({ error: 'id חסר' }, { status: 400 })

    const { error } = await supabase
      .from('generations')
      .update({ approved })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה בשמירת פידבק' }, { status: 500 })
  }
}
