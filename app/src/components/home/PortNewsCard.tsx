import { useNavigate } from 'react-router-dom'
import { Newspaper, ChevronRight } from 'lucide-react'
import { formatDateRelative } from '../../lib/formatters'
import type { NewsArticle } from '../../hooks/useNews'

interface PortNewsCardProps {
  articles: NewsArticle[]
}

export function PortNewsCard({ articles }: PortNewsCardProps) {
  const navigate = useNavigate()

  if (articles.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-800">Port News</h3>
        </div>
        <button
          onClick={() => navigate('/news')}
          className="text-xs text-blue-600 font-medium flex items-center gap-1"
        >
          All News <ChevronRight size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {articles.slice(0, 3).map(article => (
          <button
            key={article.id}
            onClick={() => navigate('/news')}
            className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
              article.category === 'union' ? 'bg-blue-100 text-blue-700' :
              article.category === 'port' ? 'bg-green-100 text-green-700' :
              article.category === 'employer' ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {article.category}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 line-clamp-2">{article.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDateRelative(article.published_at)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
