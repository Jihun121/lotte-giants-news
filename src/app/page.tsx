import { createClient } from '@supabase/supabase-js';
import ArticleFeed, { Article } from '@/components/ArticleFeed';
import { Newspaper } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getArticles(): Promise<Article[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 공개 환경변수가 설정되지 않았습니다.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, description, original_url, publisher, published_at, tags')
    .order('published_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('[Supabase Fetch Error]:', error);
    return [];
  }

  return (data as Article[]) || [];
}

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center font-black text-base text-white shadow-sm">
              G
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none">
                LOTTE GIANTS NEWS
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                사직 최신 뉴스 실시간 애그리게이터
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Newspaper size={14} className="text-red-500" />
              <span>LIVE FEED</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ArticleFeed initialArticles={articles} />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-12 text-center text-xs text-slate-500">
        <p>본 사이트는 비영리 목적의 팬 프로젝트이며, 모든 기사의 저작권은 각 언론사에 있습니다.</p>
      </footer>
    </div>
  );
}