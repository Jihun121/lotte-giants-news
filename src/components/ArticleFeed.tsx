'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Clock, Search, X } from 'lucide-react';

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

// 롯데 팬들이 자주 검색하는 추천 선수 및 키워드 칩
const QUICK_KEYWORDS = ['전체', '윤동희', '전준우', '황성빈', '박세웅', '김태형', '선발', '홈런'];

export default function ArticleFeed({ initialArticles }: ArticleFeedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChip, setActiveChip] = useState('전체');

  // 추천 키워드 칩 클릭 핸들러
  const handleChipClick = (keyword: string) => {
    setActiveChip(keyword);
    if (keyword === '전체') {
      setSearchTerm('');
    } else {
      setSearchTerm(keyword);
    }
  };

  // 검색어 입력 시 동작 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setActiveChip(val === '' ? '전체' : '');
  };

  // 실시간 검색어 필터링 (제목 + 본문 요약 동시 검사)
  const filteredArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return initialArticles;

    return initialArticles.filter((article) => {
      const matchTitle = article.title.toLowerCase().includes(query);
      const matchDesc = article.description ? article.description.toLowerCase().includes(query) : false;
      const matchPublisher = article.publisher.toLowerCase().includes(query);
      return matchTitle || matchDesc || matchPublisher;
    });
  }, [searchTerm, initialArticles]);

  return (
    <div className="w-full space-y-6">
      {/* 1. 상단 검색창 & 추천 키워드 칩 바 */}
      <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        
        {/* 실시간 단어 검색창 */}
        <div className="relative w-full max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="선수명, 감독, 이슈 검색 (예: 윤동희, 부상, 홈런)"
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setActiveChip('전체'); }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 원클릭 추천 키워드 칩 */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {QUICK_KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => handleChipClick(keyword)}
                className={
                  "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all " +
                  (activeChip === keyword
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700")
                }
              >
                {keyword === '전체' ? '전체보기' : '#' + keyword}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            검색 결과 <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredArticles.length}</strong>건
          </span>
        </div>
      </div>

      {/* 2. 기사 카드 반응형 그리드 */}
      {filteredArticles.length === 0 ? (
        <div className="py-24 text-center text-slate-400">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-1">
            "{searchTerm}" 검색 결과가 없습니다.
          </p>
          <p className="text-xs">
            다른 선수명이나 키워드로 검색해 보세요.
          </p>
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
                <span className="text-[11px] text-slate-400 font-medium">
                  원문 기사 읽기
                </span>
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