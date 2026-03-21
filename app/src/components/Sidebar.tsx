import { NavLink } from 'react-router-dom'
import {
  Home,
  PlusCircle,
  CalendarDays,
  BarChart3,
  Sparkles,
  FileText,
  Heart,
  Ship,
  BookOpen,
  Star,
  Anchor,
  User,
  Gift,
  ClipboardList,
  Newspaper,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'

interface NavItem {
  to: string
  icon: React.FC<{ size?: number; className?: string; strokeWidth?: number }>
  label: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/shifts', icon: PlusCircle, label: 'Log Shift' },
      { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    ],
  },
  {
    title: 'Money',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/pay-stubs', icon: FileText, label: 'Pay Stubs' },
      { to: '/contract', icon: BookOpen, label: 'Contract' },
    ],
  },
  {
    title: 'Planning',
    items: [
      { to: '/pension', icon: Heart, label: 'Pension' },
      { to: '/holidays', icon: Gift, label: 'Holidays' },
      { to: '/vessels', icon: Ship, label: 'Vessels' },
      { to: '/template-builder', icon: ClipboardList, label: 'Templates' },
    ],
  },
  {
    title: 'AI',
    items: [
      { to: '/chat', icon: Sparkles, label: 'Ask PORTPAL' },
    ],
  },
  {
    title: 'Community',
    items: [
      { to: '/news', icon: Newspaper, label: 'Port News' },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useProfile()

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Anchor size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">PORTPAL</h1>
            <p className="text-[10px] text-slate-400 font-medium">Shift Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Profile / Subscribe */}
      <div className="border-t border-slate-200 p-3 space-y-0.5">
        <NavLink
          to="/subscribe"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <Star size={18} />
          <span>Upgrade to Pro</span>
        </NavLink>
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <User size={18} />
          <span>{profile.name !== 'Longshoreman' ? profile.name : 'Profile'}</span>
        </NavLink>
      </div>
    </div>
  )
}

/** Desktop persistent sidebar — hidden on mobile */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-slate-200 bg-white h-full">
      <SidebarContent />
    </aside>
  )
}

/** Mobile hamburger + drawer overlay */
export function MobileDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button in the mobile header */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="absolute top-3 right-3">
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
