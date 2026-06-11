import { NextRequest, NextResponse } from 'next/server'
import { createZibalService } from '@/lib/zibal'
import { env } from '@/lib/env'
import { verifyAuth, getCurrentProfile } from '@/lib/dal'

const PLAN_PRICES: Record<string, number> = {
    monthly: 50000,
    yearly: 500000,
}

export async function POST(request: NextRequest) {
    try {
        let user;
        try {
            user = await verifyAuth();
        } catch (authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan } = await request.json()

        if (!plan || !PLAN_PRICES[plan]) {
            return NextResponse.json(
                { error: 'Valid plan is required' },
                { status: 400 }
            )
        }

        const amount = PLAN_PRICES[plan];
        const userId = user.id;

        const profile = await getCurrentProfile();

        if (!profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            )
        }

        const orderId = `gold_${userId}_${plan}_${Date.now()}`
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


