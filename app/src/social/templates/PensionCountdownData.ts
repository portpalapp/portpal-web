import type { PensionData } from './PensionCountdown'
import {
  PensionCountdown_Slide1,
  PensionCountdown_Slide2,
  PensionCountdown_Slide3,
  PensionCountdown_Slide4,
  PensionCountdown_TikTok,
} from './PensionCountdown'

export const examplePensionData: PensionData[] = [
  {
    weekNumber: 4,
    currentEarnings: 12400,
    goal: 120000,
    thisWeekEarnings: 2800,
    shiftsThisWeek: 5,
    projectedDate: 'Nov 12',
    status: 'ahead',
    streak: 12,
  },
  {
    weekNumber: 16,
    currentEarnings: 38500,
    goal: 120000,
    thisWeekEarnings: 2200,
    shiftsThisWeek: 4,
    projectedDate: 'Nov 28',
    status: 'on-track',
    streak: 8,
  },
  {
    weekNumber: 32,
    currentEarnings: 68000,
    goal: 120000,
    thisWeekEarnings: 1800,
    shiftsThisWeek: 3,
    projectedDate: 'Dec 15',
    status: 'behind',
    streak: 0,
  },
]

export const PensionCountdownSlides = {
  instagram: [
    PensionCountdown_Slide1,
    PensionCountdown_Slide2,
    PensionCountdown_Slide3,
    PensionCountdown_Slide4,
  ],
  tiktok: PensionCountdown_TikTok,
}
