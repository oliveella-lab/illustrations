import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Generation = {
  id: string
  description: string
  enhanced_prompt: string
  image_url: string
  approved: boolean | null
  created_at: string
}
