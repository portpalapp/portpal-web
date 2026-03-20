/**
 * INSTAGRAM MOCKUP
 * Realistic Instagram profile and post previews
 */

import { useState } from 'react'
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Grid3X3,
  PlaySquare,
  Bookmark as BookmarkIcon,
  UserPlus,
  ChevronDown,
  X,
  Home,
  Search,
  PlusSquare,
  Film,
  User as _User,
  Anchor,
  Check,
  ArrowLeft,
} from 'lucide-react'

// =============================================================================
// POST THUMBNAILS (Grid items)
// =============================================================================

const posts = [
  {
    id: 1,
    type: 'carousel',
    thumbnail: 'gradient-blue',
    headline: 'Is Your Pay Actually Right?',
    subline: 'Swipe to find out →',
    likes: 847,
    comments: 63,
    saved: 234,
  },
  {
    id: 2,
    type: 'carousel',
    thumbnail: 'gradient-navy',
    headline: '73%',
    subline: 'On track for November',
    likes: 1243,
    comments: 89,
    saved: 412,
  },
  {
    id: 3,
    type: 'single',
    thumbnail: 'white',
    headline: '42 Jobs',
    subline: '24 Terminals • 990 Combos',
    likes: 634,
    comments: 47,
    saved: 189,
  },
  {
    id: 4,
    type: 'carousel',
    thumbnail: 'gradient-orange',
    headline: '-$34',
    subline: "Would've missed it",
    likes: 2156,
    comments: 187,
    saved: 523,
  },
  {
    id: 5,
    type: 'single',
    thumbnail: 'white',
    headline: '30 sec',
    subline: 'vs 20 min spreadsheets',
    likes: 892,
    comments: 71,
    saved: 267,
  },
  {
    id: 6,
    type: 'carousel',
    thumbnail: 'gradient-blue',
    headline: 'The Math Is Complex',
    subline: 'We do it for you',
    likes: 1087,
    comments: 94,
    saved: 341,
  },
  {
    id: 7,
    type: 'single',
    thumbnail: 'gradient-navy',
    headline: 'Week 38',
    subline: 'Still on track ✓',
    likes: 567,
    comments: 38,
    saved: 156,
  },
  {
    id: 8,
    type: 'carousel',
    thumbnail: 'white',
    headline: '5 Common Errors',
    subline: 'Are you catching them?',
    likes: 1834,
    comments: 156,
    saved: 478,
  },
  {
    id: 9,
    type: 'single',
    thumbnail: 'gradient-orange',
    headline: 'Check Your Stub',
    subline: 'Found another one',
    likes: 943,
    comments: 82,
    saved: 289,
  },
]

// =============================================================================
// COMPONENTS
// =============================================================================

function PostThumbnail({ post, onClick }: { post: typeof posts[0]; onClick: () => void }) {
  const gradients: Record<string, string> = {
    'gradient-blue': 'bg-gradient-to-br from-blue-500 to-blue-700',
    'gradient-navy': 'bg-gradient-to-br from-slate-800 to-slate-900',
    'gradient-orange': 'bg-gradient-to-br from-orange-500 to-red-600',
    'white': 'bg-white',
  }

  const isWhite = post.thumbnail === 'white'

  return (
    <button
      onClick={onClick}
      className={`aspect-square ${gradients[post.thumbnail]} relative group overflow-hidden`}
    >
      {/* Content */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 ${isWhite ? 'text-slate-900' : 'text-white'}`}>
        <div className={`text-2xl md:text-3xl font-bold text-center leading-tight ${isWhite ? '' : 'drop-shadow-lg'}`}>
          {post.headline}
        </div>
        <div className={`text-xs md:text-sm mt-2 ${isWhite ? 'text-slate-500' : 'text-white/80'}`}>
          {post.subline}
        </div>
      </div>

      {/* Carousel indicator */}
      {post.type === 'carousel' && (
        <div className="absolute top-2 right-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.9">
            <path d="M4 6h12v12H4V6zm2 2v8h8V8H6zm12-4v12h2V4H8v2h10z"/>
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
        <div className="flex items-center gap-1">
          <Heart size={20} fill="white" />
          <span className="font-semibold">{post.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle size={20} fill="white" />
          <span className="font-semibold">{post.comments}</span>
        </div>
      </div>
    </button>
  )
}

function PostModal({ post, onClose }: { post: typeof posts[0]; onClose: () => void }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const gradients: Record<string, string> = {
    'gradient-blue': 'bg-gradient-to-br from-blue-500 to-blue-700',
    'gradient-navy': 'bg-gradient-to-br from-slate-800 to-slate-900',
    'gradient-orange': 'bg-gradient-to-br from-orange-500 to-red-600',
    'white': 'bg-white border border-gray-200',
  }

  const isWhite = post.thumbnail === 'white'

  const comments = [
    { user: 'docklife_mike', text: 'This is exactly what I needed 💯', time: '2h', likes: 24 },
    { user: 'ilwu_local500', text: 'Every casual needs to see this', time: '4h', likes: 67 },
    { user: 'ttdriver_van', text: 'Been using it for 3 months. Found $200 they owed me', time: '6h', likes: 89 },
    { user: 'cranegirl_bc', text: 'Finally someone made this 🙌', time: '8h', likes: 45 },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg overflow-hidden max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Post Image */}
        <div className={`${gradients[post.thumbnail]} aspect-square md:w-1/2 flex-shrink-0 flex flex-col items-center justify-center p-8 relative`}>
          <div className={`text-4xl md:text-5xl font-bold text-center leading-tight ${isWhite ? 'text-slate-900' : 'text-white drop-shadow-lg'}`}>
            {post.headline}
          </div>
          <div className={`text-lg mt-4 ${isWhite ? 'text-slate-500' : 'text-white/80'}`}>
            {post.subline}
          </div>

          {/* Carousel dots */}
          {post.type === 'carousel' && (
            <div className="absolute bottom-4 flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="md:w-1/2 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Anchor size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm flex items-center gap-1">
                portpal.app
                <Check size={14} className="text-blue-500" />
              </div>
            </div>
            <button>
              <MoreHorizontal size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption */}
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Anchor size={14} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-sm">portpal.app</span>{' '}
                <span className="text-sm text-gray-800">
                  The system is complex. 42 job types. 24 terminals. 990 possible combinations.
                  Are you catching every error? 🎯
                  <br /><br />
                  Link in bio to download free.
                  <br /><br />
                  <span className="text-blue-600">#longshoreman #ilwu #dockworker #portlife #unionstrong</span>
                </span>
                <div className="text-xs text-gray-400 mt-1">2d</div>
              </div>
            </div>

            {/* Comments */}
            {comments.map((comment, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm">{comment.user}</span>{' '}
                  <span className="text-sm">{comment.text}</span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{comment.time}</span>
                    <button className="font-semibold">{comment.likes} likes</button>
                    <button className="font-semibold">Reply</button>
                  </div>
                </div>
                <button className="self-start">
                  <Heart size={12} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t p-4">
            <div className="flex justify-between mb-3">
              <div className="flex gap-4">
                <button onClick={() => setLiked(!liked)}>
                  <Heart size={24} className={liked ? 'text-red-500 fill-red-500' : 'text-gray-800'} />
                </button>
                <button>
                  <MessageCircle size={24} className="text-gray-800" />
                </button>
                <button>
                  <Send size={24} className="text-gray-800" />
                </button>
              </div>
              <button onClick={() => setSaved(!saved)}>
                <Bookmark size={24} className={saved ? 'text-gray-800 fill-gray-800' : 'text-gray-800'} />
              </button>
            </div>
            <div className="font-semibold text-sm">
              {(post.likes + (liked ? 1 : 0)).toLocaleString()} likes
            </div>
            <div className="text-xs text-gray-400 mt-1">2 DAYS AGO</div>
          </div>

          {/* Add Comment */}
          <div className="border-t p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 text-sm outline-none"
            />
            <button className="text-blue-500 font-semibold text-sm">Post</button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:opacity-70"
        >
          <X size={28} />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN PROFILE PAGE
// =============================================================================

export function InstagramMockup() {
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Instagram Mobile Header */}
      <div className="sticky top-0 bg-white border-b z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button>
            <ArrowLeft size={24} />
          </button>
          <div className="font-semibold flex items-center gap-1">
            portpal.app
            <ChevronDown size={16} />
          </div>
          <button>
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="p-4">
          <div className="flex items-start gap-6">
            {/* Profile Pic */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center ring-2 ring-gray-200 ring-offset-2">
              <Anchor size={36} className="text-white" />
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="flex gap-6 md:gap-10 text-center">
                <div>
                  <div className="font-bold text-lg">127</div>
                  <div className="text-xs text-gray-500">posts</div>
                </div>
                <div>
                  <div className="font-bold text-lg">4,892</div>
                  <div className="text-xs text-gray-500">followers</div>
                </div>
                <div>
                  <div className="font-bold text-lg">89</div>
                  <div className="text-xs text-gray-500">following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <div className="font-semibold flex items-center gap-1">
              PORTPAL
              <Check size={16} className="text-blue-500" />
            </div>
            <div className="text-sm text-gray-500">App</div>
            <div className="text-sm mt-2 leading-relaxed">
              Shift tracking for longshoremen ⚓️
              <br />
              Every shift. Accounted for.
              <br />
              Know your numbers. Catch every error.
              <br />
              <span className="text-blue-900 font-medium">📲 Free download ↓</span>
            </div>
            <a href="#" className="text-sm text-blue-900 font-medium mt-1 block">
              portpal.app/download
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex-1 py-1.5 rounded-lg font-semibold text-sm ${
                isFollowing
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-800">
              Message
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-gray-100">
              <UserPlus size={16} />
            </button>
          </div>
        </div>

        {/* Story Highlights */}
        <div className="px-4 py-3 flex gap-4 overflow-x-auto border-b">
          {['Get Started', 'Features', 'Reviews', 'FAQ', 'Updates'].map((highlight, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl">
                    {i === 0 && '📱'}
                    {i === 1 && '⚡'}
                    {i === 2 && '⭐'}
                    {i === 3 && '❓'}
                    {i === 4 && '🆕'}
                  </span>
                </div>
              </div>
              <span className="text-xs">{highlight}</span>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex border-b">
          <button className="flex-1 py-3 flex justify-center border-b-2 border-gray-900">
            <Grid3X3 size={24} />
          </button>
          <button className="flex-1 py-3 flex justify-center text-gray-400">
            <PlaySquare size={24} />
          </button>
          <button className="flex-1 py-3 flex justify-center text-gray-400">
            <BookmarkIcon size={24} />
          </button>
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map(post => (
            <PostThumbnail
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>

        {/* Bottom padding */}
        <div className="h-20" />
      </div>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          <Home size={24} />
          <Search size={24} />
          <PlusSquare size={24} />
          <Film size={24} />
          <div className="w-6 h-6 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  )
}
