import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'

export async function POST(request: NextRequest) {
    const { access_token, refresh_token } = await request.json()
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    })

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
} 