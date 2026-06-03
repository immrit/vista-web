import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/dal';
import { checkRateLimit, getClientIdentifier, messageRateLimit } from '@/lib/rate-limit';
import { MessageSchema } from '@/lib/validation/schemas';
import { sanitizeText } from '@/lib/validation/sanitize';
import { env } from '@/lib/env';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, messageRateLimit);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'تعداد درخواست‌های شما بیش از حد مجاز است',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': (rateLimit.retryAfter ?? 60).toString(),
          },
        },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'کاربر احراز هویت نشده است.' }, { status: 401 });
    }

    const body = await request.json();
    const validated = MessageSchema.parse(body);
    const sanitizedContent = sanitizeText(validated.content);

    // Call the custom backend to send message
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    const backendRes = await fetch(
      `${env.NEXT_PUBLIC_API_URL || 'https://api.coffevista.ir'}/v1/chat/conversations/${validated.conversationId}/messages`,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        content: sanitizedContent,
        media_url: validated.attachmentUrl,
        message_type: validated.attachmentType,
        reply_to_message_id: validated.replyToId,
      })
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'خطا در ارسال پیام' },
        { status: backendRes.status }
      );
    }

    const message = await backendRes.json();

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Send message error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'داده‌های ورودی نامعتبر است',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'خطای سرور',
      },
      { status: 500 },
    );
  }
}
