import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// 1. Supabase 클라이언트 초기화
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

// 백엔드 작업용 클라이언트 (Row Level Security 우회 권한)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// 2. RSS 파서 및 유틸리티 함수
// ---------------------------------------------------------------------------
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

function generateUrlHash(url: string): string {
  try {
    const parsed = new URL(url);
    // 불필요한 추적 쿼리스트링 제거
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'oc'];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    return crypto.createHash('sha256').update(parsed.toString()).digest('hex');
  } catch {
    return crypto.createHash('sha256').update(url).digest('hex');
  }
}

// ---------------------------------------------------------------------------
// 3. 기사 동기화 파이프라인
// ---------------------------------------------------------------------------
export async function syncLotteGiantsNews(): Promise<{ total: number; inserted: number }> {
  // 구글 뉴스 검색 쿼리 (특수문자 URL 인코딩 적용)
  const queryText = '"롯데 자이언츠" when:1d -백화점 -케미칼 -마트 -건설';
  const searchQuery = encodeURIComponent(queryText);
  const feedUrl = 'https://news.google.com/rss/search?q=' + searchQuery + '&hl=ko&gl=KR&ceid=KR:ko';

  let feed;
  try {
    feed = await parser.parseURL(feedUrl);
  } catch (fetchError) {
    throw new Error(`[RSS Fetch Error] 구글 뉴스 피드를 가져오지 못했습니다: ${(fetchError as Error).message}`);
  }

  if (!feed.items || feed.items.length === 0) {
    return { total: 0, inserted: 0 };
  }

  const articlesToUpsert = feed.items.map((item) => {
    const rawTitle = item.title || '제목 없음';
    
    // 구글 뉴스 제목 포맷 정제: "실제 기사 제목 - 언론사명" 형태 분리
    const titleParts = rawTitle.split(' - ');
    const publisher = titleParts.length > 1 ? titleParts.pop()?.trim() : '기타';
    const cleanTitle = titleParts.join(' - ').trim();

    const originalUrl = item.link || '';
    const urlHash = generateUrlHash(originalUrl);

    // 주요 키워드 기반 태그 분류
    const tags: string[] = [];
    if (/감독|김태형/.test(cleanTitle)) tags.push('김태형 감독');
    if (/선발|투수|불펜|마운드/.test(cleanTitle)) tags.push('투수진');
    if (/홈런|타율|타자|라인업/.test(cleanTitle)) tags.push('타선');
    if (/사직|직관|팬/.test(cleanTitle)) tags.push('사직구장');

    return {
      url_hash: urlHash,
      title: cleanTitle,
      description: item.contentSnippet ? item.contentSnippet.trim() : null,
      original_url: originalUrl,
      naver_url: null, // RSS 방식은 원문 직링크 우선
      publisher: publisher || '언론사 미상',
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      tags,
    };
  });

  // DB에 적재 (url_hash가 이미 존재하면 중복 무시)
  const { data, error } = await supabase
    .from('articles')
    .upsert(articlesToUpsert, { onConflict: 'url_hash', ignoreDuplicates: true })
    .select('id');

  if (error) {
    throw new Error(`[Supabase Upsert Error] ${error.message}`);
  }

  return {
    total: articlesToUpsert.length,
    inserted: data ? data.length : 0,
  };
}