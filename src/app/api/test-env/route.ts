import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        console.log('=== TEST ENVIRONMENT VARIABLES ===')

        const envVars = {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasSmtpHost: !!process.env.SMTP_HOST,
            hasSmtpUser: !!process.env.SMTP_USER,
            hasSmtpPass: !!process.env.SMTP_PASS,
            hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
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