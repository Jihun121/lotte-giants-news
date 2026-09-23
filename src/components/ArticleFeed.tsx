'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Clock } from 'lucide-react';

export interface Article {
  id: number;
  title: string;
  description: string | null;
  original_url: string;
  publisher: string;
  published_at: string;
  tags: string[];
}

interface ArticleFeedProps {
  initialArticles: Article[];
}

function formatRelativeTime(dateString: string): string {
  const published = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - published.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return diffInMinutes + '분 전';
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return diffInHours + '시간 전';
  
  const diffInDays = Math.floor(diffInHours / 24);
  return diffInDays + '일 전';
}

const PRESET_TAGS = ['전체', '김태형 감독', '투수진', '타선', '사직구장'];

export default function ArticleFeed({ initialArticles }: ArticleFeedProps) {
  const [selectedTag, setSelectedTag] = useState<string>('전체');

  const filteredArticles = useMemo(() => {
    if (selectedTag === '전체') return initialArticles;
    return initialArticles.filter((article) => article.tags && article.tags.includes(selectedTag));
  }, [selectedTag, initialArticles]);

  const getButtonClass = (tag: string) => {
    const base = "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ";
    if (selectedTag === tag) {
      return base + "bg-red-600 text-white shadow-sm ring-2 ring-red-600/20";
    }
    return base + "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700";
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={getButtonClass(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          총 <strong className="text-slate-900 dark:text-slate-100">{filteredArticles.length}</strong>개의 기사
        </span>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="py-24 text-center text-slate-400 text-sm">
          해당 분류의 최신 기사가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredArticles.map((article) => (
            <a
              key={article.id}
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {article.publisher}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatRelativeTime(article.published_at)}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                  {article.title}
                </h2>

                {article.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {article.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {article.tags && article.tags.length > 0 ? (
                    article.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                      >
                        {'#' + t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400">#자이언츠</span>
                  )}
                </div>
                <ExternalLink
                  size={14}
                  className="text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2"
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}