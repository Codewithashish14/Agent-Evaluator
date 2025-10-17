import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { interaction_id, prompt, response, score, latency_ms, flags, pii_tokens_redacted } = body
    
    if (!interaction_id || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: interaction_id and score are required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const evaluation = {
      user_id: user.id,
      interaction_id,
      prompt: prompt || '',
      response: response || '',
      score: Math.max(0, Math.min(1, score)),
      latency_ms: latency_ms || 0,
      flags: flags || [],
      pii_tokens_redacted: pii_tokens_redacted || 0,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert([evaluation])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to store evaluation: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0] 
    })
  } catch (error) {
    console.error('Ingestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}