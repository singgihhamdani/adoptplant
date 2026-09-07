import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Melakukan query ringan ke database (tabel projects) untuk memicu aktivitas PostgREST
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1)

    if (error) {
      // Jika tabel projects belum dibuat atau error query, coba ping root rest api
      return NextResponse.json(
        {
          success: false,
          warning: 'PostgREST terpanggil namun query tabel mengembalikan error.',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase keep-alive ping berhasil. Status aktivitas database ter-reset.',
      timestamp: new Date().toISOString(),
      recordsFound: data?.length ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal menghubungi Supabase.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
