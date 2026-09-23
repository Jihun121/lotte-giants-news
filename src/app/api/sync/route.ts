import { NextRequest, NextResponse } from 'next/server';
import { syncLotteGiantsNews } from '@/lib/collector';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Vercel Cron 자동 호출 또는 인증 토큰 검증
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 개발 환경(localhost)이 아니고, CRON_SECRET이 설정되어 있다면 보안 검사 수행
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await syncLotteGiantsNews();
    return NextResponse.json({
      success: true,
      message: `동기화 완료: \({result.total}개 검토됨, 신규\){result.inserted}개 저장됨.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync Route Handler Error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}