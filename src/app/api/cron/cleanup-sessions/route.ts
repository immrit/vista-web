import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/services/sessionService.server';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    // بررسی Auth Header برای Cron Job
    const authHeader = request.headers.get('authorization');
    const cronSecret = env.CRON_SECRET || process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedCount = await cleanupExpiredSessions();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} expired sessions cleaned up`,
    });
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

