import { NextRequest, NextResponse } from 'next/server'
import { createZibalService } from '@/lib/zibal'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
    try {
        const { userId, plan, amount } = await request.json()

        if (!userId || !plan || !amount) {
            return NextResponse.json(
                { error: 'User ID, plan, and amount are required' },
                { status: 400 }
            )
        }

        // Fetch user profile from custom backend
        let profile = null;
        try {
            const profileRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/profiles/${userId}`);
            if (profileRes.ok) {
                profile = await profileRes.json();
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }

        if (!profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            )
        }

        const orderId = `gold_${userId}_${Date.now()}`
        const zibalService = createZibalService()
        const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/payment/callback`
        
        const zibalResponse = await zibalService.createPaymentRequest({
            amount: amount * 10,
            callbackUrl,
            description: `خرید تیک طلایی - ${plan === 'monthly' ? 'ماهانه' : 'سالانه'}`,
            orderId,
            mobile: profile.email || undefined,
        })

        if (!zibalResponse.trackId) {
            throw new Error('TrackId not received from Zibal')
        }

        // Payment ledger persistence should live in vista-backend.

        const paymentUrl = zibalService.getPaymentUrl(zibalResponse.trackId)

        return NextResponse.json(
            {
                success: true,
                trackId: zibalResponse.trackId,
                orderId,
                paymentUrl,
                message: 'Payment request created successfully',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}


