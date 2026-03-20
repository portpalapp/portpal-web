import { NavLink } from 'react-router-dom'
import { Home, PlusCircle, CalendarDays, BarChart3, Sparkles } from 'lucide-react'

export function Navigation() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/shifts', icon: PlusCircle, label: 'Log Shift' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/chat', icon: Sparkles, label: 'AI' },
  ]

  return (
    <nav className="bg-white border-t border-slate-200 px-2 pt-2 safe-bottom" style={{ paddingBottom: `max(env(safe-area-inset-bottom, 0px), 0.5rem)` }}>
      <div className="flex justify-around items-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
