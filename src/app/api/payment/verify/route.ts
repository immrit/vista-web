import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const adminSupabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 🔍 چک کن ببین این پرداخت قبلاً verify شده یا نه
    const { data: existingPayment } = await adminSupabase
      .from('payment_logs')
      .select('*')
      .eq('track_id', trackId)
      .eq('user_id', userId)
      .single()

    // ✅ اگه قبلاً verify شده، نتیجه قبلی رو برگردون
    if (existingPayment?.status === 'verified') {
      console.log('✅ Payment already verified, returning cached result')
      
      // دریافت اطلاعات پروفایل فعلی
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('subscription_started_at, subscription_expires_at, subscription_plan')
        .eq('id', userId)
        .single()

      return NextResponse.json(
        {
          success: true,
          message: 'این پرداخت قبلاً تایید شده است',
          profile,
          payment: {
            refNumber: existingPayment.ref_number,
            amount: existingPayment.amount,
            paidAt: existingPayment.paid_at,
          },
          subscription: {
            plan: profile?.subscription_plan || plan,
            startedAt: profile?.subscription_started_at,
            expiresAt: profile?.subscription_expires_at,
          },
        },
        { status: 200 }
      )
    }

    // 🆕 اگه pending هست، الان verify کن
    const zibalService = createZibalService()
    
    let verifyResponse
    try {
      verifyResponse = await zibalService.verifyPayment(Number(trackId))
    } catch (zibalError: any) {
      // ⚠️ اگه زیبال گفت "قبلا تایید شده"، یعنی موفق بوده
      if (zibalError.message?.includes('قبلا تایید شده') || zibalError.message?.includes('201')) {
        console.log('⚠️ Zibal says already verified, treating as success')
        
        // از دیتابیس اطلاعات قبلی رو بگیر
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('subscription_started_at, subscription_expires_at, subscription_plan')
          .eq('id', userId)
          .single()

        // آپدیت لاگ به verified
        await adminSupabase
          .from('payment_logs')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .eq('track_id', trackId)

        return NextResponse.json(
          {
            success: true,
            message: 'پرداخت قبلاً تایید شده بود',
            profile,
            payment: {
              refNumber: existingPayment?.ref_number,
              amount: existingPayment?.amount,
              paidAt: existingPayment?.paid_at,
            },
            subscription: {
              plan: profile?.subscription_plan || plan,
              startedAt: profile?.subscription_started_at,
              expiresAt: profile?.subscription_expires_at,
            },
          },
          { status: 200 }
        )
      }
      
      // برای خطاهای دیگه، throw کن
      throw zibalError
    }

    // 🎯 محاسبه زمان شروع و پایان اشتراک
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

    // آپدیت لاگ پرداخت
    await adminSupabase
      .from('payment_logs')
      .update({
        status: 'verified',
        ref_number: verifyResponse.refNumber,
        card_number: verifyResponse.cardNumber,
        paid_at: verifyResponse.paidAt,
        verified_at: new Date().toISOString(),
      })
      .eq('track_id', trackId)

    // ✅ آپدیت پروفایل با تیک طلایی + زمان‌های اشتراک
    const { data: profile, error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        is_verified: true,
        verification_type: 'goldTick',
        role: 'premium',
        subscription_plan: plan,
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: endDate.toISOString(),
        updated_at: new Date().toISOString(),
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

    console.log('✅ Profile updated successfully with goldTick:', {
      userId,
      plan,
      startedAt: startDate.toISOString(),
      expiresAt: endDate.toISOString()
    })

    return NextResponse.json(
      {
        success: true,
        message: 'پرداخت با موفقیت تایید شد و تیک طلایی فعال شد',
        profile,
        payment: {
          refNumber: verifyResponse.refNumber,
          amount: verifyResponse.amount / 10, // تبدیل ریال به تومان
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
    
    // در صورت خطا، لاگ پرداخت را به عنوان failed علامت‌گذاری می‌کنیم
    if (trackId) {
      try {
        const adminSupabase = createClient(
          env.NEXT_PUBLIC_SUPABASE_URL,
          env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        await adminSupabase
          .from('payment_logs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('track_id', trackId)
      } catch (logError) {
        console.error('Error updating payment log:', logError)
      }
    }

    return NextResponse.json(
      {
        error: 'خطا در تایید پرداخت',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
