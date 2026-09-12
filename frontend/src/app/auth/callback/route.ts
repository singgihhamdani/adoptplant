import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      console.warn('Auth callback exchangeCodeForSession error:', error)
    } catch (err) {
      console.error('Auth callback unexpected error:', err)
    }
  }

  // Redirect to next (e.g. /reset-password) or fallback
  return NextResponse.redirect(`${origin}${next}`)
}
