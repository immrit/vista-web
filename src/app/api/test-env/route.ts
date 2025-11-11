import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
    try {
        console.log('=== TEST ENVIRONMENT VARIABLES ===')

        const envVars = {
            hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
            hasSmtpHost: !!process.env.SMTP_HOST,
            hasSmtpUser: !!process.env.SMTP_USER,
            hasSmtpPass: !!process.env.SMTP_PASS,
            hasAppUrl: !!env.NEXT_PUBLIC_APP_URL,
        }

        console.log('Environment variables status:', envVars)

        return NextResponse.json({
            message: 'Environment variables test',
            status: envVars,
            missing: Object.entries(envVars)
                .filter(([key, value]) => !value)
                .map(([key]) => key)
        })

    } catch (error) {
        console.error('Error in test env:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 