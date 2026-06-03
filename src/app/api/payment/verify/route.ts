import { NextRequest, NextResponse } from 'next/server'
import { createZibalService } from '@/lib/zibal'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  let trackId: number | null = null
  
  try {
    const body = await request.json()
    trackId = body.trackId
    const { userId, plan } = body

    if (!trackId || !userId || !plan) {
      return NextResponse.json(
        { error: 'TrackId, User ID, and plan are required' },
        { status: 400 }
      )
    }

    const zibalService = createZibalService()
    let verifyResponse
    try {
      verifyResponse = await zibalService.verifyPayment(Number(trackId))
    } catch (zibalError: any) {
      if (zibalError.message?.includes('قبلا تایید شده') || zibalError.message?.includes('201')) {
        console.log('⚠️ Zibal says already verified, treating as success')
        return NextResponse.json(
          {
            success: true,
            message: 'پرداخت قبلاً تایید شده بود',
            subscription: {
              plan,
            },
          },
          { status: 200 }
        )
      }
      throw zibalError
    }

    const startDate = new Date()
    const endDate = new Date(startDate)
    
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (plan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Call custom backend to update user profile to premium
    try {
      // This endpoint updates the authenticated user's profile on vista-backend.
      await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/me/profile/update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              verification_type: 'premium',
              role: 'premium',
              subscription_plan: plan,
              subscription_expires_at: endDate.toISOString(),
          })
      });
    } catch (updateError) {
      console.error('Error updating profile on backend:', updateError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'پرداخت با موفقیت تایید شد و تیک طلایی فعال شد',
        payment: {
          refNumber: verifyResponse.refNumber,
          amount: verifyResponse.amount / 10,
          paidAt: verifyResponse.paidAt,
        },
        subscription: {
          plan,
          startedAt: startDate.toISOString(),
          expiresAt: endDate.toISOString(),
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    
    return NextResponse.json(
      {
        error: 'خطا در تایید پرداخت',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
