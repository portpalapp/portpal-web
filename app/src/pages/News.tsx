import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Newspaper,
  ExternalLink,
  Clock,
  Info,
  Tag,
} from 'lucide-react';
import { useNews, type NewsArticle } from '../hooks/useNews';
import { formatDateRelative } from '../lib/formatters';

type CategoryFilter = 'all' | 'union' | 'port' | 'industry' | 'labour';

const CATEGORY_COLORS: Record<NewsArticle['category'], { bg: string; text: string }> = {
  union: { bg: 'bg-blue-100', text: 'text-blue-700' },
  employer: { bg: 'bg-orange-100', text: 'text-orange-700' },
  port: { bg: 'bg-green-100', text: 'text-green-700' },
  terminal: { bg: 'bg-purple-100', text: 'text-purple-700' },
  government: { bg: 'bg-red-100', text: 'text-red-700' },
  industry: { bg: 'bg-slate-100', text: 'text-slate-700' },
  labour: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

const FILTER_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'union', label: 'Union' },
  { key: 'port', label: 'Port' },
  { key: 'industry', label: 'Industry' },
  { key: 'labour', label: 'Labour' },
];

export function News() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const queryCategory = filter === 'all' ? undefined : filter;
  const { articles, loading } = useNews(queryCategory);

  const tabStyle = (t: CategoryFilter) =>
    `px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
      filter === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="hover:opacity-70">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Newspaper size={22} className="text-blue-600" />
          <span className="text-lg font-bold text-slate-800">Port News</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3">
        {FILTER_TABS.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={tabStyle(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Newspaper size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No news articles yet.</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon.</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="flex flex-col gap-3">
            {articles.map((article) => {
              const colors = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.industry;
              const publishedDate = article.published_at
                ? article.published_at.slice(0, 10)
                : article.fetched_at.slice(0, 10);

              return (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200"
                >
                  {/* Source badge and tags */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}
                    >
                      {article.source_name || article.category}
                    </span>
                    {article.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag size={12} className="text-slate-400" />
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-slate-800 mb-1 leading-snug">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-slate-600 mb-3 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>

                  {/* Worker Impact */}
                  {article.worker_impact && (
                    <div className="bg-blue-50 rounded-lg p-2 mb-3 flex items-start gap-2">
                      <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700 leading-snug">
                        {article.worker_impact}
                      </p>
                    </div>
                  )}

                  {/* Footer: date + external link */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {formatDateRelative(publishedDate)}
                      </span>
                    </div>
                    <a
                      href={article.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Read article
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
