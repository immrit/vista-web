import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    // بررسی service role key
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    // ایجاد کلاینت ادمین
    const adminSupabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )

    // دریافت اطلاعات کاربر
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('email, username, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // ایجاد orderId یکتا
    const orderId = `gold_${userId}_${Date.now()}`

    // ایجاد سرویس زیبال
    const zibalService = createZibalService()

    // ایجاد درخواست پرداخت
    const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/payment/callback`
    
    const zibalResponse = await zibalService.createPaymentRequest({
      amount: amount * 10, // تبدیل تومان به ریال
      callbackUrl,
      description: `خرید تیک طلایی - ${plan === 'monthly' ? 'ماهانه' : 'سالانه'}`,
      orderId,
      mobile: profile.email || undefined,
    })

    if (!zibalResponse.trackId) {
      throw new Error('TrackId not received from Zibal')
    }

    // ذخیره اطلاعات پرداخت در دیتابیس (اختیاری - برای لاگ‌گیری)
    const { error: paymentLogError } = await adminSupabase
      .from('payment_logs')
      .insert({
        user_id: userId,
        order_id: orderId,
        track_id: zibalResponse.trackId,
        amount: amount,
        plan: plan,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

    if (paymentLogError) {
      console.error('Error logging payment:', paymentLogError)
      // ادامه میدیم چون لاگ کردن الزامی نیست
    }

    // دریافت لینک پرداخت
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



