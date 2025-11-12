import { NextRequest, NextResponse } from 'next/server';

import { verifyAuth } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier, messageRateLimit } from '@/lib/rate-limit';
import { MessageSchema } from '@/lib/validation/schemas';
import { sanitizeText } from '@/lib/validation/sanitize';

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

    const user = await verifyAuth();
    const body = await request.json();
    const validated = MessageSchema.parse(body);
    const sanitizedContent = sanitizeText(validated.content);

    const supabase = await createClient();

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', validated.conversationId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        {
          error: 'دسترسی به این گفتگو وجود ندارد',
        },
        { status: 403 },
      );
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: validated.conversationId,
        sender_id: user.id,
        content: sanitizedContent,
        attachment_url: validated.attachmentUrl,
        attachment_type: validated.attachmentType,
        reply_to_message_id: validated.replyToId,
      })
      .select()
      .single();

    if (messageError) {
      throw messageError;
    }

    await supabase
      .from('conversations')
      .update({
        last_message: sanitizedContent.substring(0, 100),
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.conversationId);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'داده‌های ورودی نامعتبر است',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          error: 'لطفاً وارد حساب کاربری خود شوید',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: 'خطایی رخ داده است',
      },
      { status: 500 },
    );
  }
}

