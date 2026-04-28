import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const STYLE_CONTEXT = `You are an expert at writing prompts for a fine-tuned illustration model.
The model uses this exact style — follow every rule strictly:

COLORS (use only these):
- Brand pastels: #FAE7EC, #CFF5DF, #DBEEFF, #FFCEDB, #9AFFC5, #BBDFFF, #FF92AA, #5FCBD0, #89C6FD
- Plus black and white only
- Flat fills — no gradients

STROKE:
- Thin black stroke outline on every element and shape

SHADOW:
- Hard solid black drop shadow, always offset to the bottom-LEFT, no blur

BACKGROUND:
- Always pure white

COMPOSITION:
- Single centered object, white background, no scenes, no text, no humans

The trigger word for this style is: ILSTYLE

Write a concise English prompt (max 40 words) starting with ILSTYLE. Describe only the object and reference the key style rules: thin black stroke, flat color fills from the brand palette, hard black drop shadow bottom-left, white background.`

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()
    if (!description) return NextResponse.json({ error: 'תיאור חסר' }, { status: 400 })

    // Generate enhanced prompt with Claude
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

    // Start async prediction (returns immediately)
    const [modelId, versionId] = process.env.REPLICATE_MODEL!.split(':')
    const prediction = await replicate.predictions.create({
      version: versionId,
      input: { prompt: enhancedPrompt },
    })

    // Save to Supabase with pending status
    const { data, error } = await supabase
      .from('generations')
      .insert({
        description,
        enhanced_prompt: enhancedPrompt,
        image_url: '',
        prediction_id: prediction.id,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) console.error('Supabase insert error:', error)

    return NextResponse.json({
      predictionId: prediction.id,
      enhancedPrompt,
      id: data?.id,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'שגיאה ביצירת האיור' }, { status: 500 })
  }
}
