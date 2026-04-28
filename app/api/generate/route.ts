import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const STYLE_CONTEXT = `You are an expert at writing prompts for a fine-tuned illustration model.
The model was trained on a specific illustration style with these characteristics:
- Bold black outlines on all shapes
- Pastel color palette: mint green (#C8EDE3), baby pink (#F7C5CC), sky blue (#B5D9F0), coral pink (#F06090)
- Hard solid drop shadow (not blurred) offset bottom-right in near-black
- Subtle diagonal highlight/sheen on 3D surfaces
- Clean geometric shapes with rounded corners
- White background, single centered object
- Flat-but-3D style, tech/SaaS product illustration aesthetic
- No text, no scenes, no humans

The trigger word for this style is: ILSTYLE

Write a concise English prompt (max 40 words) starting with ILSTYLE that describes only the requested object.`

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()
    if (!description) return NextResponse.json({ error: 'תיאור חסר' }, { status: 400 })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Write a Flux image generation prompt for: "${description}"\n\nRespond with only the prompt, nothing else.`
      }],
      system: STYLE_CONTEXT,
    })

    const enhancedPrompt = (message.content[0] as { type: string; text: string }).text.trim()

    const output = await replicate.run(
      process.env.REPLICATE_MODEL as `${string}/${string}:${string}`,
      { input: { prompt: enhancedPrompt, num_outputs: 1 } }
    ) as string[]

    const imageUrl = Array.isArray(output) ? output[0] : output

    const { data, error } = await supabase
      .from('generations')
      .insert({ description, enhanced_prompt: enhancedPrompt, image_url: imageUrl })
      .select('id')
      .single()

    if (error) console.error('Supabase insert error:', error)

    return NextResponse.json({ imageUrl, enhancedPrompt, id: data?.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה ביצירת האיור' }, { status: 500 })
  }
}
