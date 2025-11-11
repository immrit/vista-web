import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// این API برای verify کردن پرداخت و update کردن profile استفاده می‌شود

export async function POST(request: NextRequest) {
    try {
        const { paymentId, authority, status, userId, plan } = await request.json()

        if (!paymentId || !userId || !plan) {
            return NextResponse.json(
                { error: 'Payment ID, User ID, and plan are required' },
                { status: 400 }
            )
        }

        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
            return NextResponse.json(
                { error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        // Create admin client
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        // TODO: اینجا باید با درگاه پرداخت واقعی verify کنید
        // مثال برای زرین‌پال:
        // const verifyResponse = await verifyZarinpalPayment({
        //     authority: authority,
        //     amount: plan === 'monthly' ? 99000 : 899000
        // })
        // 
        // if (verifyResponse.status !== 100) {
        //     return NextResponse.json(
        //         { error: 'Payment verification failed', details: verifyResponse.message },
        //         { status: 400 }
        //     }

        // برای حالا، اگر status === 'success' باشد، پرداخت را موفق در نظر می‌گیریم
        if (status !== 'success') {
            return NextResponse.json(
                { error: 'Payment was not successful' },
                { status: 400 }
            )
        }

        // Update profile with premium verification
        const { data: profile, error: updateError } = await adminSupabase
            .from('profiles')
            .update({
                is_verified: true,
                verification_type: 'premium',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating profile:', updateError)
            return NextResponse.json(
                { error: 'Failed to update profile', details: updateError.message },
                { status: 500 }
            )
        }

        console.log('Profile updated successfully with premium verification:', profile)

        return NextResponse.json(
            {
                success: true,
                message: 'Payment verified and profile updated successfully',
                profile
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error verifying payment:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}



