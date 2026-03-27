import { Flame, Trophy } from 'lucide-react'

interface StreakBadgesProps {
  currentStreak: number
  totalShiftsLogged: number
}

export function StreakBadges({ currentStreak, totalShiftsLogged }: StreakBadgesProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Flame className="text-orange-500" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
            <p className="text-xs text-orange-600">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Trophy className="text-amber-500" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{totalShiftsLogged}</p>
            <p className="text-xs text-amber-600">Shifts Logged</p>
          </div>
        </div>
      </div>
    </div>
  )
}
