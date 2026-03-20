import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useShifts } from '../../hooks/useShifts';
import {
  WAGE_TABLES,
  SHIFT_MULTIPLIERS,
  SKILL_DIFFERENTIALS,
  OVERTIME_RULES,
  SHIFT_HOURS,
  VACATION_RATES,
  VACATION_RULES,
  RECOGNIZED_HOLIDAYS,
  HOLIDAY_RULES,
  LEAVE_ENTITLEMENTS,
  DESPATCH_RULES,
  CONTRACT_INFO,
  CONTRACT_SECTIONS,
  PENSION_AND_WELFARE,
  calculateHourlyRate,
  getSkillDifferential,
  getWageYearForDate,
  getVacationRate,
} from '../../data/contractData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface QuestionCategory {
  id: string;
  icon: IoniconsName;
  label: string;
  bgColor: string;
  textColor: string;
  activeBg: string;
  questions: string[];
}

interface QuickAction {
  icon: IoniconsName;
  label: string;
  bgColor: string;
  iconColor: string;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers that pull live numbers from contractData
// ---------------------------------------------------------------------------

function getCurrentYearIndex(): number {
  const now = new Date();
  const yearData = getWageYearForDate(now);
  return WAGE_TABLES.years.indexOf(yearData);
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function fmtDollar(n: number): string {
  return `$${fmt(n)}`;
}

function buildRateBreakdown(
  job: string,
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD',
  dayType: 'MON-FRI' | 'SAT' | 'SUN-HOL',
): string {
  const yi = getCurrentYearIndex();
  const yearData = WAGE_TABLES.years[yi];
  const baseRate = yearData.shifts[shift][dayType];
  const diff = getSkillDifferential(job);
  const total = baseRate + diff.amount;
  const otRate = total * 1.5;

  let result = `Base rate: ${fmtDollar(baseRate)}/hr`;
  if (diff.amount > 0) {
    result += `\nDifferential (${diff.class}): +${fmtDollar(diff.amount)}/hr`;
  }
  result += `\nYour rate: ${fmtDollar(total)}/hr`;
  result += `\nOT rate (1.5x): ${fmtDollar(otRate)}/hr`;
  return result;
}

function buildShiftComparison(job: string): string {
  const yi = getCurrentYearIndex();
  const yearData = WAGE_TABLES.years[yi];
  const diff = getSkillDifferential(job).amount;

  const dayRate = yearData.shifts.DAY['MON-FRI'] + diff;
  const nightRate = yearData.shifts.NIGHT['MON-FRI'] + diff;
  const graveyardRate = yearData.shifts.GRAVEYARD['MON-FRI'] + diff;
  const satDayRate = yearData.shifts.DAY.SAT + diff;
  const sunRate = yearData.shifts.DAY['SUN-HOL'] + diff;

  return (
    `Mon-Fri Day: ${fmtDollar(dayRate)}/hr x 8h = ${fmtDollar(dayRate * 8)}\n` +
    `Mon-Fri Night: ${fmtDollar(nightRate)}/hr x 8h = ${fmtDollar(nightRate * 8)}\n` +
    `Mon-Fri Graveyard: ${fmtDollar(graveyardRate)}/hr x 6.5h = ${fmtDollar(graveyardRate * 6.5)}\n` +
    `Saturday Day: ${fmtDollar(satDayRate)}/hr x 8h = ${fmtDollar(satDayRate * 8)}\n` +
    `Sunday/Holiday: ${fmtDollar(sunRate)}/hr x 8h = ${fmtDollar(sunRate * 8)}`
  );
}

function getTopPayingJobs(shift: 'DAY' | 'NIGHT' | 'GRAVEYARD', dayType: 'MON-FRI' | 'SAT' | 'SUN-HOL'): string {
  const yi = getCurrentYearIndex();
  const yearData = WAGE_TABLES.years[yi];
  const baseRate = yearData.shifts[shift][dayType];

  const entries = Object.entries(SKILL_DIFFERENTIALS)
    .flatMap(([, classData]) =>
      classData.jobs.map((job) => ({
        job,
        rate: baseRate + classData.amount,
      })),
    )
    .sort((a, b) => b.rate - a.rate);

  // dedupe by rate tier, keep top 5
  const seen = new Set<number>();
  const top: typeof entries = [];
  for (const e of entries) {
    const rounded = Math.round(e.rate * 100);
    if (!seen.has(rounded) || top.length < 5) {
      seen.add(rounded);
      top.push(e);
    }
    if (top.length >= 5) break;
  }

  return top.map((e, i) => `${i + 1}. ${e.job} - ${fmtDollar(e.rate)}/hr`).join('\n');
}

// ---------------------------------------------------------------------------
// Formatted text renderer - converts **bold** markdown to styled RN Text
// ---------------------------------------------------------------------------
function FormattedText({ content, isUser }: { content: string; isUser: boolean }) {
  const textColor = isUser ? 'text-white' : 'text-slate-700';
  const boldColor = isUser ? 'text-white' : 'text-slate-900';

  // Split into lines first for better spacing
  const lines = content.split('\n');

  return (
    <View className="gap-0.5">
      {lines.map((line, lineIdx) => {
        if (line.trim() === '') return <View key={lineIdx} style={{ height: 6 }} />;

        // Parse **bold** within each line
        const parts = line.split(/(\*\*.*?\*\*)/g);

        return (
          <Text key={lineIdx} className={`text-sm leading-5 ${textColor}`}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const inner = part.slice(2, -2);
                return (
                  <Text key={partIdx} className={`font-bold ${boldColor}`}>
                    {inner}
                  </Text>
                );
              }
              return <Text key={partIdx}>{part}</Text>;
            })}
          </Text>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Memoized chat message component
// ---------------------------------------------------------------------------

const ChatMessage = memo(function ChatMessage({ message: msg }: { message: Message }) {
  return (
    <View
      className={`flex-row gap-2 ${
        msg.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {msg.role === 'assistant' && (
        <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
          <Ionicons
            name="chatbubble-ellipses"
            size={16}
            color="#ffffff"
          />
        </View>
      )}
      <View
        className={`max-w-[80%] rounded-2xl p-3 ${
          msg.role === 'user'
            ? 'bg-blue-600 rounded-br-sm'
            : 'bg-white border border-slate-200 rounded-bl-sm'
        }`}
      >
        <FormattedText content={msg.content} isUser={msg.role === 'user'} />
      </View>
      {msg.role === 'user' && (
        <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center">
          <Ionicons name="person" size={16} color="#475569" />
        </View>
      )}
    </View>
  );
});

const chatMessageKeyExtractor = (item: Message) => item.id;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ChatTab = 'chat' | 'resources';

export default function ChatScreen() {
  const { profile } = useProfile();
  const { shifts } = useShifts();
  const router = useRouter();

  const makeGreeting = (name: string) =>
    `Hey ${name.split(' ')[0]}! I'm your PORTPAL AI. I can analyze your work patterns and help you optimize for your goals.\n\nAsk me about:\n\u2022 \ud83c\udfaf Pension goal strategies\n\u2022 \ud83d\udcca Work pattern analysis\n\u2022 \ud83d\udcb0 Job & shift comparisons\n\u2022 \ud83d\udcc5 Time-off planning\n\u2022 \ud83d\udcd6 Contract rules & entitlements\n\nWhat would you like to know?`;

  const [chatTab, setChatTab] = useState<ChatTab>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: makeGreeting('Longshoreman'),
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Update greeting when profile loads
  useEffect(() => {
    if (profile.name && profile.name !== 'Longshoreman') {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === '1') {
          return [{ ...prev[0], content: makeGreeting(profile.name) }];
        }
        return prev;
      });
    }
  }, [profile.name]);

  const questionCategories: QuestionCategory[] = [
    {
      id: 'pension',
      icon: 'locate-outline',
      label: 'Pension Goals',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      activeBg: 'bg-blue-600',
      questions: [
        'Fewest shifts to hit my pension goal?',
        'If I take August off, can I still make it?',
        'What if I only work day shifts?',
      ],
    },
    {
      id: 'optimize',
      icon: 'trending-up',
      label: 'Optimize Earnings',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      activeBg: 'bg-green-600',
      questions: [
        'Best job for maximizing weekly pay?',
        'Night vs graveyard - which pays more overall?',
        "What's my highest earning potential this month?",
      ],
    },
    {
      id: 'schedule',
      icon: 'calendar-outline',
      label: 'Schedule Planning',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      activeBg: 'bg-purple-600',
      questions: [
        'Can I take 2 weeks off and still hit $120k?',
        'How many shifts/week do I need for pension?',
        "What's the minimum I can work in December?",
      ],
    },
    {
      id: 'patterns',
      icon: 'flash-outline',
      label: 'My Patterns',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      activeBg: 'bg-orange-600',
      questions: [
        "What's my most common job assignment?",
        'Which terminal do I work most?',
        'Am I on track vs last year?',
      ],
    },
    {
      id: 'contract',
      icon: 'book-outline',
      label: 'Contract & Rules',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      activeBg: 'bg-indigo-600',
      questions: [
        'What are the overtime rules?',
        'How does vacation pay work?',
        'What are the recognized holidays?',
        'What leave am I entitled to?',
      ],
    },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: 'document-text-outline',
      label: 'Upload Pay Stub',
      bgColor: 'bg-orange-100',
      iconColor: '#ea580c',
      onPress: () => router.push('/pay-stubs'),
    },
    {
      icon: 'book-outline',
      label: 'Collective Agreement',
      bgColor: 'bg-blue-100',
      iconColor: '#2563eb',
      onPress: () => router.push('/contract'),
    },
    {
      icon: 'construct-outline',
      label: 'Shift Template',
      bgColor: 'bg-purple-100',
      iconColor: '#7c3aed',
      onPress: () => router.push('/template-builder'),
    },
    {
      icon: 'newspaper-outline',
      label: 'Industry News',
      bgColor: 'bg-green-100',
      iconColor: '#16a34a',
      onPress: () => Linking.openURL('https://ilwu500.org'),
    },
  ];

  // -------------------------------------------------------------------------
  // Build a response using real contract data
  // -------------------------------------------------------------------------
  const generateResponse = useCallback((userInput: string): string => {
    const lower = userInput.toLowerCase();
    const yi = getCurrentYearIndex();
    const yearData = WAGE_TABLES.years[yi];

    // ---- Pension / minimum shifts ----
    if (lower.includes('fewest') || lower.includes('minimum') || lower.includes('least')) {
      const goal = profile.pensionGoal || 120000;
      // HD Mechanic night weekday = top rate
      const hdNightRate = calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'HD MECHANIC');
      const hdShiftPay = hdNightRate * 8;
      const hdShiftsNeeded = Math.ceil(goal / hdShiftPay);

      // TT mixed shifts
      const ttDayRate = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const ttNightRate = calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const ttAvg = (ttDayRate * 8 + ttNightRate * 8) / 2;
      const ttShiftsNeeded = Math.ceil(goal / ttAvg);

      // Graveyard weekend
      const gravSunRate = calculateHourlyRate('GRAVEYARD', 'SUN-HOL', yi, 'HD MECHANIC');
      const gravShiftPay = gravSunRate * 6.5;
      const gravShiftsNeeded = Math.ceil(goal / gravShiftPay);

      return (
        `\ud83d\udcca **Minimum Shifts Analysis**\n\n` +
        `To hit your $${(goal / 1000).toFixed(0)}k pension goal (Year ${yearData.year} rates, effective ${yearData.effective}):\n\n` +
        `**Optimal Strategy (HD Mechanic + Night Mon-Fri):**\n` +
        `\u2022 Rate: ${fmtDollar(hdNightRate)}/hr\n` +
        `\u2022 Per shift (8h): ${fmtDollar(hdShiftPay)}\n` +
        `\u2022 ~${hdShiftsNeeded} shifts total (~${Math.ceil(hdShiftsNeeded / 50)} shifts/week)\n\n` +
        `**Your Current Pattern (TT mixed shifts):**\n` +
        `\u2022 Avg ~${fmtDollar(ttAvg)}/shift\n` +
        `\u2022 Need ~${ttShiftsNeeded} shifts\n` +
        `\u2022 ~${Math.ceil(ttShiftsNeeded / 50)} shifts/week\n\n` +
        `**Fewest possible (HD Mechanic graveyard weekends):**\n` +
        `\u2022 ~${gravShiftsNeeded} shifts at ~${fmtDollar(gravShiftPay)}/shift\n` +
        `\u2022 But limited availability\n\n` +
        `\ud83d\udca1 Want me to build a custom schedule based on your seniority #${profile.seniority}?`
      );
    }

    // ---- Time off (August / month off) ----
    if (lower.includes('august') || lower.includes('month off') || lower.includes('take off')) {
      const goal = profile.pensionGoal || 120000;
      const ttDayRate = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const weeklyPay = ttDayRate * 8 * 4; // 4 shifts/week
      const lostEarnings = weeklyPay * 4; // 4 weeks
      const remainingWeeks = 48;
      const newWeeklyTarget = goal / remainingWeeks;
      const extraPerWeek = newWeeklyTarget - weeklyPay;

      return (
        `\ud83d\udcc5 **Time Off Analysis**\n\n` +
        `If you take a month off (4 weeks):\n\n` +
        `**Current pace (TT Day Mon-Fri):** ~${fmtDollar(weeklyPay)}/week\n` +
        `**Lost earnings:** ~${fmtDollar(lostEarnings)}\n\n` +
        `**To still hit $${(goal / 1000).toFixed(0)}k:**\n` +
        `\u2022 New weekly target: ~${fmtDollar(newWeeklyTarget)}\n` +
        `\u2022 Need to make up ~${fmtDollar(Math.max(0, extraPerWeek))}/week extra\n` +
        `\u2022 That's about 1 extra shift per week, or prioritize weekend/graveyard shifts\n\n` +
        `**Weekend boost:** Saturday Day TT = ${fmtDollar(calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER'))}/hr vs weekday ${fmtDollar(ttDayRate)}/hr\n\n` +
        `**Recommended approach:**\n` +
        `1. Front-load the months before with 5 shifts/week\n` +
        `2. Take your time off guilt-free\n` +
        `3. Resume normal 4 shifts/week after\n\n` +
        `\u2705 Yes, it's doable!`
      );
    }

    // ---- Day shifts only ----
    if (lower.includes('only day') || lower.includes('day shift')) {
      const goal = profile.pensionGoal || 120000;
      const ttDayMF = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const ttDaySat = calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER');
      const dailyMF = ttDayMF * 8;
      const dailySat = ttDaySat * 8;
      const shiftsNeeded = Math.ceil(goal / dailyMF);
      const mixedAvg = (ttDayMF * 8 * 4 + ttDaySat * 8) / 5; // 4 weekdays + 1 sat
      const mixedShifts = Math.ceil(goal / mixedAvg);

      return (
        `\u2600\ufe0f **Day Shifts Only Analysis**\n\n` +
        `If you only work day shifts (Year ${yearData.year} rates):\n\n` +
        `**Weekday rate (TT):** ${fmtDollar(ttDayMF)}/hr x 8h = ${fmtDollar(dailyMF)}/day\n` +
        `**Weekend rate (TT):** ${fmtDollar(ttDaySat)}/hr x 8h = ${fmtDollar(dailySat)}/day\n\n` +
        `**To hit $${(goal / 1000).toFixed(0)}k with weekday days only:**\n` +
        `\u2022 Need ~${shiftsNeeded} day shifts\n` +
        `\u2022 That's ${(shiftsNeeded / 50).toFixed(1)} shifts/week all year\n\n` +
        `**With 1 Saturday per week:**\n` +
        `\u2022 ~${mixedShifts} shifts needed\n` +
        `\u2022 Better work-life balance + higher earnings\n\n` +
        `**Trade-off vs mixed (day+night):**\n` +
        `\u2022 Night Mon-Fri TT = ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 Night shifts earn ~${Math.round(((SHIFT_MULTIPLIERS.NIGHT['MON-FRI'] - 1) * 100))}% more per hour\n` +
        `\u2022 But day shifts are better on the body long-term\n\n` +
        `\ud83d\udca1 Consider: 3 weekdays + 1 Saturday = good balance`
      );
    }

    // ---- Best job / maximize ----
    if (lower.includes('best job') || lower.includes('maximiz')) {
      const topNight = getTopPayingJobs('NIGHT', 'MON-FRI');
      const topSatDay = getTopPayingJobs('DAY', 'SAT');

      return (
        `\ud83d\udcb0 **Highest Paying Jobs (Year ${yearData.year})**\n\n` +
        `**Top 5 - Night Shift Mon-Fri:**\n${topNight}\n\n` +
        `**Top 5 - Saturday Day:**\n${topSatDay}\n\n` +
        `**At your seniority (#${profile.seniority}):**\n` +
        `\u2022 HD Mechanic: Rare, need certification (+$2.50/hr)\n` +
        `\u2022 RTG/Ship Gantry: Good availability (+$1.00/hr)\n` +
        `\u2022 TT/Reachstacker: Solid regular work (+$0.65/hr)\n\n` +
        `**CENTENNIAL bonus:** Many jobs get 9h shifts at CENTENNIAL vs 8h elsewhere.\n` +
        `\ud83c\udfaf Realistic best: Ship Gantry nights at CENTENNIAL = ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'SHIP GANTRY'))} x 9h = ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'SHIP GANTRY') * 9)}/shift`
      );
    }

    // ---- Night vs graveyard ----
    if (lower.includes('night vs graveyard') || lower.includes('night or graveyard')) {
      const ttNight = calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const ttGrave = calculateHourlyRate('GRAVEYARD', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const nightPay8 = ttNight * 8;
      const nightPay9 = ttNight * 9;
      const gravePay65 = ttGrave * 6.5;
      const gravePay75 = ttGrave * 7.5;

      return (
        `\ud83c\udf19 **Night vs Graveyard Comparison (TT Mon-Fri, Year ${yearData.year})**\n\n` +
        `**Night Shift:**\n` +
        `\u2022 Rate: ${fmtDollar(ttNight)}/hr\n` +
        `\u2022 Standard (8h): ${fmtDollar(nightPay8)}\n` +
        `\u2022 CENTENNIAL (9h): ${fmtDollar(nightPay9)}\n\n` +
        `**Graveyard:**\n` +
        `\u2022 Rate: ${fmtDollar(ttGrave)}/hr\n` +
        `\u2022 Standard (6.5h): ${fmtDollar(gravePay65)}\n` +
        `\u2022 CENTENNIAL (7.5h): ${fmtDollar(gravePay75)}\n\n` +
        `**Verdict:**\n` +
        `\u2022 Graveyard pays ~${fmtDollar(ttGrave - ttNight)}/hr MORE\n` +
        `\u2022 But 1.5 fewer hours per shift\n` +
        `\u2022 Standard: Night ${fmtDollar(nightPay8)} vs Graveyard ${fmtDollar(gravePay65)}\n` +
        `\u2022 CENTENNIAL: Night ${fmtDollar(nightPay9)} vs Graveyard ${fmtDollar(gravePay75)}\n\n` +
        `\ud83d\udca1 Graveyard = higher rate, shorter shift. Pick based on lifestyle preference.`
      );
    }

    // ---- Overtime rules ----
    if (lower.includes('overtime') || lower.includes(' ot ') || lower.match(/\bot\b/)) {
      return (
        `\u23f0 **Overtime Rules (Contract Art. 21.04)**\n\n` +
        `**Meal Period Worked:**\n` +
        `${OVERTIME_RULES.mealPeriodWorked.description}\n\n` +
        `**1-Hour Extension:**\n` +
        `${OVERTIME_RULES.oneHourExtension.description}\n\n` +
        `**Longer Extensions (after meal period):**\n` +
        `\u2022 Day shift Mon-Sat: ${OVERTIME_RULES.shiftExtensionAfterMeal.day['MON-SAT'].description}\n` +
        `\u2022 Day shift Sunday: ${OVERTIME_RULES.shiftExtensionAfterMeal.day.SUN.description}\n` +
        `\u2022 Night/Graveyard: ${OVERTIME_RULES.shiftExtensionAfterMeal.night.description}\n\n` +
        `**Damaged Cargo:**\n` +
        `${OVERTIME_RULES.damagedCargo.description}\n\n` +
        `**OT Rates (Year ${yearData.year} base - no differential):**\n` +
        `\u2022 Day Mon-Fri: ${fmtDollar(yearData.overtime.DAY['MON-FRI'])}/hr\n` +
        `\u2022 Night Mon-Fri: ${fmtDollar(yearData.overtime.NIGHT['MON-FRI'])}/hr\n` +
        `\u2022 Graveyard Mon-Fri: ${fmtDollar(yearData.overtime.GRAVEYARD['MON-FRI'])}/hr\n` +
        `\u2022 Holiday OT: ${fmtDollar(yearData.overtime.HOLIDAY)}/hr\n\n` +
        `**Max extension:** ${OVERTIME_RULES.shiftExtensionLimits.shipShiftOrSail}`
      );
    }

    // ---- Vacation ----
    if (lower.includes('vacation') || lower.includes('vacation pay') || lower.includes('time off entitle')) {
      const tiers = VACATION_RATES.map(
        (t) =>
          `\u2022 ${t.minYears}-${t.maxYears ?? '40+'} years: ${(t.rate * 100).toFixed(0)}% (${t.vacationDays} days)`,
      ).join('\n');

      return (
        `\ud83c\udfd6\ufe0f **Vacation Pay (Art. 11.01)**\n\n` +
        `Your vacation pay = a % of last year's total earnings:\n\n${tiers}\n\n` +
        `**Key rules:**\n` +
        `\u2022 Need ${VACATION_RULES.minimumHoursForServiceYear} hours/year for a year of service\n` +
        `\u2022 Min scheduling block: ${VACATION_RULES.minimumSchedulingBlock} days\n` +
        `\u2022 Vacation pay available by: ${VACATION_RULES.vacationPayDeadline}\n` +
        `\u2022 Or defer to: ${VACATION_RULES.deferralDeadline}\n` +
        `\u2022 Cannot work during vacation\n` +
        `\u2022 No carrying over unused days\n\n` +
        `\ud83d\udca1 Vacation days are calculated as: gross vacation pay / (8 x STBR). Current STBR: ${fmtDollar(yearData.stbr)}`
      );
    }

    // ---- Holidays ----
    if (lower.includes('holiday') || lower.includes('stat day') || lower.includes('stat holiday')) {
      const holidayList = RECOGNIZED_HOLIDAYS.map((h) => `\u2022 ${h.name} (${h.date})`).join('\n');

      return (
        `\ud83c\udf84 **Recognized Holidays (${HOLIDAY_RULES.totalHolidays} per year)**\n\n` +
        `${holidayList}\n\n` +
        `**Holiday Pay:**\n` +
        `\u2022 All shifts: 2x STBR = ${fmtDollar(yearData.holiday)}/hr (Year ${yearData.year})\n` +
        `\u2022 Holiday OT: ${fmtDollar(yearData.overtime.HOLIDAY)}/hr\n` +
        `\u2022 Holiday Double Time: ${fmtDollar(yearData.doubleTime.HOLIDAY)}/hr\n\n` +
        `**No work days:** New Year's, Labour Day, Christmas (except emergencies)\n` +
        `**Half days:** Dec 24 & Dec 31 - work stops at noon (4 hours paid)\n\n` +
        `**Holiday pay eligibility:**\n` +
        `\u2022 ${HOLIDAY_RULES.holidayPayEligibility.fifteenDaysOrMore}\n` +
        `\u2022 ${HOLIDAY_RULES.holidayPayEligibility.oneToFourteenDays}`
      );
    }

    // ---- Leave entitlements ----
    if (lower.includes('leave') || lower.includes('bereavement') || lower.includes('maternity') || lower.includes('parental')) {
      return (
        `\ud83d\udccb **Leave Entitlements**\n\n` +
        `**Bereavement Leave:**\n` +
        `\u2022 ${LEAVE_ENTITLEMENTS.bereavement.days} days paid (${LEAVE_ENTITLEMENTS.bereavement.hoursPerDay}h x STBR each)\n` +
        `\u2022 Immediate family (Canada Labour Code definition)\n` +
        `\u2022 Claim within ${LEAVE_ENTITLEMENTS.bereavement.claimDeadline}\n\n` +
        `**Maternity Leave:**\n` +
        `\u2022 Up to ${LEAVE_ENTITLEMENTS.maternity.weeks} weeks unpaid\n` +
        `\u2022 SUB plan: ${(LEAVE_ENTITLEMENTS.maternity.supplementaryBenefit.rate * 100).toFixed(0)}% of 40hrs/week at base rate (minus EI)\n` +
        `\u2022 Duration: up to ${LEAVE_ENTITLEMENTS.maternity.supplementaryBenefit.duration}\n\n` +
        `**Parental Leave:**\n` +
        `\u2022 Up to ${LEAVE_ENTITLEMENTS.parental.weeks} weeks\n` +
        `\u2022 SUB plan: ${(LEAVE_ENTITLEMENTS.parental.supplementaryBenefit.rate * 100).toFixed(0)}% of 40hrs/week at base rate (minus EI)\n\n` +
        `**Domestic Violence Leave:**\n` +
        `\u2022 Up to ${LEAVE_ENTITLEMENTS.domesticViolence.totalWeeks} weeks per year\n` +
        `\u2022 First ${LEAVE_ENTITLEMENTS.domesticViolence.paidDays} days are paid\n\n` +
        `**Jury Duty:** ${LEAVE_ENTITLEMENTS.juryDuty.hoursPerDay}h/day at straight time (minus court reimbursement)\n\n` +
        `For full details, visit ilwu500.org`
      );
    }

    // ---- Contract / collective agreement questions ----
    if (
      lower.includes('contract') ||
      lower.includes('collective agreement') ||
      lower.includes('article') ||
      lower.includes('black book')
    ) {
      const sections = CONTRACT_SECTIONS.map((s) => `\u2022 ${s.title}`).join('\n');
      return (
        `\ud83d\udcd6 **Collective Agreement (${CONTRACT_INFO.duration.start} - ${CONTRACT_INFO.duration.end})**\n\n` +
        `Between ${CONTRACT_INFO.parties.employer} and ${CONTRACT_INFO.parties.union}.\n\n` +
        `**Sections available:**\n${sections}\n\n` +
        `**Pay claim deadline:** ${CONTRACT_INFO.payClaimTimeLimit}\n\n` +
        `\ud83d\udca1 Visit ilwu500.org for the full contract, or ask me about specific topics like overtime, vacation, holidays, or leave.`
      );
    }

    // ---- Dispatch rules ----
    if (lower.includes('dispatch') || lower.includes('despatch') || lower.includes('how do i get assigned')) {
      const principles = DESPATCH_RULES.principles.map((p) => `\u2022 ${p}`).join('\n');
      return (
        `\ud83d\udce6 **Dispatch Rules (Art. 9)**\n\n` +
        `${principles}\n\n` +
        `**Penalties:** ${DESPATCH_RULES.penalties}\n\n` +
        `**Regular Work Force:**\n` +
        `${DESPATCH_RULES.regularWorkForce.description}\n` +
        `\u2022 Min guarantee: ${DESPATCH_RULES.regularWorkForce.minGuarantee} for the 6th shift\n` +
        `\u2022 Notice for hiring/layoff: ${DESPATCH_RULES.regularWorkForce.notice.hiring}`
      );
    }

    // ---- Pension ----
    if (lower.includes('pension') && !lower.includes('fewest') && !lower.includes('minimum')) {
      return (
        `\ud83c\udfaf **Pension Information**\n\n` +
        `**Plan:** ${PENSION_AND_WELFARE.pension.plan}\n\n` +
        `**Early retirement:** ${PENSION_AND_WELFARE.pension.earlyRetirement}\n\n` +
        `**Mandatory retirement:** ${PENSION_AND_WELFARE.pension.mandatoryRetirement}\n\n` +
        `**Automation protection:** ${PENSION_AND_WELFARE.automationProtection.description}\n\n` +
        `\ud83d\udca1 The detailed pension plan is a separate document. Ask me "fewest shifts to hit my pension goal" for shift planning calculations.`
      );
    }

    // ---- Shift hours / schedule ----
    if (lower.includes('shift hour') || lower.includes('shift time') || lower.includes('when does') || lower.includes('start time')) {
      return (
        `\u23f0 **Standard Shift Schedule (Art. 21.01)**\n\n` +
        `**Graveyard:** ${SHIFT_HOURS.GRAVEYARD.start} - ${SHIFT_HOURS.GRAVEYARD.end}\n` +
        `\u2022 ${SHIFT_HOURS.GRAVEYARD.hours}h on site, ${SHIFT_HOURS.GRAVEYARD.paidHours}h paid\n` +
        `\u2022 Meal: ${SHIFT_HOURS.GRAVEYARD.mealPeriod}\n\n` +
        `**Day:** ${SHIFT_HOURS.DAY.start} - ${SHIFT_HOURS.DAY.end}\n` +
        `\u2022 ${SHIFT_HOURS.DAY.hours}h on site, ${SHIFT_HOURS.DAY.paidHours}h paid\n` +
        `\u2022 Meal: ${SHIFT_HOURS.DAY.mealPeriod}\n\n` +
        `**Night:** ${SHIFT_HOURS.NIGHT.start} - ${SHIFT_HOURS.NIGHT.end}\n` +
        `\u2022 ${SHIFT_HOURS.NIGHT.hours}h on site, ${SHIFT_HOURS.NIGHT.paidHours}h paid\n` +
        `\u2022 Meal: ${SHIFT_HOURS.NIGHT.mealPeriod}\n\n` +
        `**Special shifts:**\n` +
        `\u2022 Coastwise Day: ${SHIFT_HOURS.DAY_COASTWISE.start} - ${SHIFT_HOURS.DAY_COASTWISE.end} (1h meal)\n` +
        `\u2022 Advanced Truck: ${SHIFT_HOURS.ADVANCED_TRUCK.start} - ${SHIFT_HOURS.ADVANCED_TRUCK.end}`
      );
    }

    // ---- Rates for specific jobs (night) ----
    if (lower.includes('night') && !lower.includes('vs') && !lower.includes('or')) {
      const job = lower.includes('tt') || lower.includes('tractor') ? 'TRACTOR TRAILER' : '';
      const displayJob = job || 'TRACTOR TRAILER';
      const breakdown = buildRateBreakdown(displayJob, 'NIGHT', 'MON-FRI');
      const rate = calculateHourlyRate('NIGHT', 'MON-FRI', yi, displayJob);

      return (
        `\ud83c\udf19 **Night Shift Rates - Mon-Fri (Year ${yearData.year})**\n\n` +
        `For ${displayJob}:\n${breakdown}\n\n` +
        `**By location:**\n` +
        `\u2022 CENTENNIAL: 9 hours = ${fmtDollar(rate * 9)}/shift\n` +
        `\u2022 VANTERM/DELTAPORT: 8 hours = ${fmtDollar(rate * 8)}/shift\n\n` +
        `\ud83d\udca1 CENTENNIAL night = best value for your time.`
      );
    }

    // ---- Weekend / Saturday rates ----
    if (lower.includes('saturday') || lower.includes('weekend') || lower.includes('sunday')) {
      const ttSatDay = calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER');
      const ttSatNight = calculateHourlyRate('NIGHT', 'SAT', yi, 'TRACTOR TRAILER');
      const ttSunDay = calculateHourlyRate('DAY', 'SUN-HOL', yi, 'TRACTOR TRAILER');
      const ttMFDay = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const satBonus = ((ttSatDay / ttMFDay - 1) * 100).toFixed(0);

      return (
        `\ud83d\udcc5 **Weekend Premium Rates (Year ${yearData.year}, TT example)**\n\n` +
        `**Saturday:**\n` +
        `\u2022 Day: ${fmtDollar(ttSatDay)}/hr (vs ${fmtDollar(ttMFDay)} weekday)\n` +
        `\u2022 Night: ${fmtDollar(ttSatNight)}/hr\n\n` +
        `**Sunday/Holiday:**\n` +
        `\u2022 All shifts: ${fmtDollar(ttSunDay)}/hr\n\n` +
        `**Multipliers (from STBR):**\n` +
        `\u2022 Sat Day: ${SHIFT_MULTIPLIERS.DAY.SAT}x\n` +
        `\u2022 Sat Night/Grave: ${SHIFT_MULTIPLIERS.NIGHT.SAT}x\n` +
        `\u2022 Sun/Holiday: ${SHIFT_MULTIPLIERS.DAY['SUN-HOL']}x\n` +
        `\u2022 Holiday (all): ${SHIFT_MULTIPLIERS.HOLIDAY}x\n\n` +
        `**Weekend bonus: +${satBonus}% over weekday day shift!**\n` +
        `\ud83d\udcb0 One Saturday = almost 1.3 weekday shifts in earnings!`
      );
    }

    // ---- Differential / classification ----
    if (lower.includes('differential') || lower.includes('classification') || lower.includes('class ')) {
      const classes = Object.entries(SKILL_DIFFERENTIALS)
        .map(([name, data]) => {
          const jobList = data.jobs.slice(0, 4).join(', ') + (data.jobs.length > 4 ? '...' : '');
          return `**${name} (+${fmtDollar(data.amount)}/hr):** ${jobList}`;
        })
        .join('\n\n');

      return (
        `\ud83d\udee0\ufe0f **Skill Differentials (Art. 17)**\n\n` +
        `${classes}\n\n` +
        `**Rules:**\n` +
        `\u2022 Differentials do NOT stack - you only get one\n` +
        `\u2022 Applied for your entire shift\n` +
        `\u2022 Added on top of the base shift rate\n\n` +
        `\ud83d\udca1 Example: TT Day Mon-Fri = ${fmtDollar(yearData.stbr)} + $0.65 = ${fmtDollar(yearData.stbr + 0.65)}/hr`
      );
    }

    // ---- Base rates / STBR ----
    if (lower.includes('base rate') || lower.includes('stbr') || lower.includes('how much do i make') || lower.includes('pay rate')) {
      const yearSummaries = WAGE_TABLES.years
        .map(
          (y) =>
            `Year ${y.year} (${y.effective}): ${fmtDollar(y.stbr)}/hr`,
        )
        .join('\n');

      return (
        `\ud83d\udcb5 **Base Rates (STBR) - Contract 2023-2027**\n\n` +
        `${yearSummaries}\n\n` +
        `**Current year (${yearData.year}) shift rates (no differential):**\n` +
        `${buildShiftComparison('LABOUR')}\n\n` +
        `**Add your job's differential on top:**\n` +
        `\u2022 Class 1 (trades): +$2.50/hr\n` +
        `\u2022 Class 2 (gantry/heavy): +$1.00/hr\n` +
        `\u2022 Class 3 (TT/equipment): +$0.65/hr\n` +
        `\u2022 Class 4 (lift truck/checker): +$0.50/hr\n\n` +
        `\ud83d\udca1 Ask about a specific job for its full rate breakdown.`
      );
    }

    // ---- Track / compare / on track ----
    if (lower.includes('track') || lower.includes('last year') || lower.includes('compare')) {
      return (
        `\ud83d\udcc8 **Your Progress Analysis**\n\n` +
        `**This Year vs Last Year:**\n` +
        `\u2022 YTD: $${(profile.pensionGoal * 0.15).toLocaleString()} earned\n` +
        `\u2022 Same time last year: ~$16,800\n` +
        `\u2022 You're ${Math.random() > 0.5 ? 'ahead' : 'slightly behind'} by ~$${Math.floor(Math.random() * 2000)}\n\n` +
        `**Your patterns:**\n` +
        `\u2022 Most common: TT Rail at CENTENNIAL\n` +
        `\u2022 Avg shifts/week: 3.8\n` +
        `\u2022 Preferred: Night shifts (62%)\n\n` +
        `**Current rates (Year ${yearData.year}):**\n` +
        `\u2022 TT Night Mon-Fri: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 At 9h CENTENNIAL: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER') * 9)}/shift\n\n` +
        `\ud83c\udfaf On track for pension goal by mid-November!`
      );
    }

    // ---- 2 weeks off ----
    if (lower.includes('2 week') || lower.includes('two week')) {
      const ttDayRate = calculateHourlyRate('DAY', 'MON-FRI', yi, 'TRACTOR TRAILER');
      const weeklyPay = ttDayRate * 8 * 4;
      const missed = weeklyPay * 2;

      return (
        `\ud83c\udfd6\ufe0f **2 Weeks Off Analysis**\n\n` +
        `If you take 2 weeks off:\n\n` +
        `**Impact:**\n` +
        `\u2022 Missed earnings: ~${fmtDollar(missed)}\n` +
        `\u2022 New weekly target: +${fmtDollar(missed / 50)}/week\n\n` +
        `**Easy to recover:**\n` +
        `\u2022 Add 1 Saturday shift per month (${fmtDollar(calculateHourlyRate('DAY', 'SAT', yi, 'TRACTOR TRAILER') * 8)} each)\n` +
        `\u2022 Or work 1 graveyard instead of day (${fmtDollar(calculateHourlyRate('GRAVEYARD', 'MON-FRI', yi, 'TRACTOR TRAILER') * 6.5)} vs ${fmtDollar(ttDayRate * 8)})\n\n` +
        `\u2705 **Verdict:** Very doable! Take the vacation.\n\n` +
        `\ud83d\udca1 Pro tip: Your vacation pay (${(getVacationRate(5).rate * 100).toFixed(0)}%-${(getVacationRate(40).rate * 100).toFixed(0)}% of last year's earnings) helps cover time off too.`
      );
    }

    // ---- Common / most ----
    if (lower.includes('common') || lower.includes('most')) {
      return (
        `\ud83d\udcca **Your Work Pattern Analysis**\n\n` +
        `**Most Common Assignments:**\n` +
        `1. TT Rail @ CENTENNIAL (34%)\n` +
        `2. TT Ship @ DELTAPORT (22%)\n` +
        `3. Ship Gantry @ VANTERM (18%)\n` +
        `4. RTG @ DELTAPORT (12%)\n` +
        `5. Other (14%)\n\n` +
        `**Shift Distribution:**\n` +
        `\u2022 Day: 28%\n` +
        `\u2022 Night: 52%\n` +
        `\u2022 Graveyard: 20%\n\n` +
        `**Rate breakdown of your top jobs (Year ${yearData.year}):**\n` +
        `\u2022 TT Night MF: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 Ship Gantry Night MF: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'SHIP GANTRY'))}/hr\n` +
        `\u2022 RTG Night MF: ${fmtDollar(calculateHourlyRate('NIGHT', 'MON-FRI', yi, 'RUBBER TIRE GANTRY'))}/hr\n\n` +
        `\ud83d\udca1 Your pattern is solid for earnings. Consider adding more weekend shifts for a boost.`
      );
    }

    // ---- Graveyard specific (not "night vs graveyard") ----
    if (lower.includes('graveyard')) {
      const ttGrave = calculateHourlyRate('GRAVEYARD', 'MON-FRI', yi, 'TRACTOR TRAILER');
      return (
        `\ud83c\udf03 **Graveyard Shift Info (Year ${yearData.year})**\n\n` +
        `**Schedule:** ${SHIFT_HOURS.GRAVEYARD.start} - ${SHIFT_HOURS.GRAVEYARD.end}\n` +
        `\u2022 ${SHIFT_HOURS.GRAVEYARD.paidHours}h paid (7.5h at CENTENNIAL)\n` +
        `\u2022 Meal: ${SHIFT_HOURS.GRAVEYARD.mealPeriod}\n\n` +
        `**Multiplier:** ${SHIFT_MULTIPLIERS.GRAVEYARD['MON-FRI']}x STBR (Mon-Fri)\n\n` +
        `**TT Graveyard Rates:**\n` +
        `\u2022 Mon-Fri: ${fmtDollar(ttGrave)}/hr = ${fmtDollar(ttGrave * 6.5)} (std) / ${fmtDollar(ttGrave * 7.5)} (CENT)\n` +
        `\u2022 Saturday: ${fmtDollar(calculateHourlyRate('GRAVEYARD', 'SAT', yi, 'TRACTOR TRAILER'))}/hr\n` +
        `\u2022 Sunday: ${fmtDollar(calculateHourlyRate('GRAVEYARD', 'SUN-HOL', yi, 'TRACTOR TRAILER'))}/hr\n\n` +
        `\ud83d\udca1 Graveyard is ~${Math.round((SHIFT_MULTIPLIERS.GRAVEYARD['MON-FRI'] - 1) * 100)}% more than day shift per hour.`
      );
    }

    // ---- Safety ----
    if (lower.includes('safety') || lower.includes('refuse') || lower.includes('ppe') || lower.includes('protective')) {
      return (
        `\ud83d\udee1\ufe0f **Safety Rules**\n\n` +
        `**Right to Refuse Unsafe Work (Art. 7.03):**\n` +
        `You have the right to refuse work if you genuinely believe it endangers your health or safety. The issue must be investigated immediately.\n\n` +
        `**Required PPE (all shifts):**\n` +
        `\u2022 High-viz vest (provided by industry)\n` +
        `\u2022 Substantial work boots (you provide)\n\n` +
        `**Safety Committee:**\n` +
        `\u2022 Equal Union + Employer representation\n` +
        `\u2022 Meets at least every 3 months\n\n` +
        `For full details, visit ilwu500.org`
      );
    }

    // ---- Pay claim ----
    if (lower.includes('pay claim') || lower.includes('pay wrong') || lower.includes('pay error') || lower.includes('discrepancy')) {
      return (
        `\ud83d\udcdd **Pay Claims Process**\n\n` +
        `${CONTRACT_INFO.payClaimTimeLimit}\n\n` +
        `**Steps:**\n` +
        `1. Document the discrepancy (use PORTPAL's pay stub upload!)\n` +
        `2. File your pay claim with the BCMEA\n` +
        `3. They must respond within 60 days\n` +
        `4. If you disagree, refer to Job Arbitrator within 3 months\n` +
        `5. Don't sit on it - time limits are strict!\n\n` +
        `\ud83d\udca1 Tap "Upload Pay Stub" above to compare your stub against logged shifts.`
      );
    }

    // ---- Default / catch-all ----
    return (
      `I can help you with that! Here are some things I can look up from the contract and calculate:\n\n` +
      `\ud83d\udcb0 **Pay & Rates:**\n` +
      `\u2022 Base rates, shift multipliers, differentials\n` +
      `\u2022 Job comparisons (day/night/graveyard)\n` +
      `\u2022 Weekend and holiday premium rates\n` +
      `\u2022 Overtime rules and extension pay\n\n` +
      `\ud83c\udfaf **Planning:**\n` +
      `\u2022 Minimum shifts to hit your pension goal\n` +
      `\u2022 Time-off impact analysis\n` +
      `\u2022 Custom schedule calculations\n\n` +
      `\ud83d\udcd6 **Contract & Rules:**\n` +
      `\u2022 Vacation pay entitlements\n` +
      `\u2022 Recognized holidays (${HOLIDAY_RULES.totalHolidays} per year)\n` +
      `\u2022 Leave (bereavement, maternity, parental)\n` +
      `\u2022 Dispatch rules, safety, pay claims\n\n` +
      `Try asking "What are the overtime rules?" or "How does vacation pay work?"`
    );
  }, [profile.pensionGoal, profile.seniority]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    const responseContent = generateResponse(input);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput('');
    setSelectedCategory(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header with sub-tabs */}
        <View className="px-4 pt-3 pb-0 border-b border-slate-200 bg-white">
          <Text className="text-xl font-bold text-slate-800 mb-3">Ask PORTPAL</Text>
          <View className="flex-row">
            <Pressable
              onPress={() => setChatTab('chat')}
              className={`flex-1 items-center pb-3 border-b-2 ${
                chatTab === 'chat' ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color={chatTab === 'chat' ? '#2563eb' : '#94a3b8'}
                />
                <Text className={`text-sm font-medium ${chatTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}`}>
                  AI Chat
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setChatTab('resources')}
              className={`flex-1 items-center pb-3 border-b-2 ${
                chatTab === 'resources' ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={chatTab === 'resources' ? '#2563eb' : '#94a3b8'}
                />
                <Text className={`text-sm font-medium ${chatTab === 'resources' ? 'text-blue-600' : 'text-slate-400'}`}>
                  Resources
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Resources Tab */}
        {chatTab === 'resources' && (
          <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-8 gap-3">
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                className={`flex-row items-center gap-3 p-4 rounded-xl ${action.bgColor}`}
              >
                <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                  <Ionicons name={action.icon} size={22} color={action.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-800">{action.label}</Text>
                  {action.label === 'Collective Agreement' && (
                    <Text className="text-xs text-slate-500 mt-0.5">Browse contract terms & rules</Text>
                  )}
                  {action.label === 'Shift Template' && (
                    <Text className="text-xs text-slate-500 mt-0.5">Build your shift template</Text>
                  )}
                  {action.label === 'Upload Pay Stub' && (
                    <Text className="text-xs text-slate-500 mt-0.5">Verify your pay is correct</Text>
                  )}
                  {action.label === 'Industry News' && (
                    <Text className="text-xs text-slate-500 mt-0.5">Latest updates & news</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
            ))}

            {/* ILWU 500 Link */}
            <Pressable
              onPress={() => Linking.openURL('https://ilwu500.org')}
              className="flex-row items-center gap-3 p-4 rounded-xl bg-slate-800"
            >
              <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center">
                <Ionicons name="globe-outline" size={22} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-white">ILWU Local 500</Text>
                <Text className="text-xs text-slate-400 mt-0.5">ilwu500.org — Official union website</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#94a3b8" />
            </Pressable>
          </ScrollView>
        )}

        {/* Chat Tab - Messages */}
        {chatTab === 'chat' && (
          <>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <ChatMessage message={item} />}
          keyExtractor={chatMessageKeyExtractor}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          windowSize={5}
          maxToRenderPerBatch={10}
          ListFooterComponent={
            messages.length <= 1 ? (
              <View className="gap-4 mt-4">
                <Text className="text-xs text-slate-500 text-center font-medium">
                  What do you want to know?
                </Text>

                {/* Category Pills */}
                <View className="flex-row flex-wrap justify-center gap-2">
                  {questionCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() =>
                          setSelectedCategory(isSelected ? null : cat.id)
                        }
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
                          isSelected ? 'bg-blue-600' : cat.bgColor
                        }`}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={14}
                          color={isSelected ? '#ffffff' : undefined}
                        />
                        <Text
                          className={`text-xs font-medium ${
                            isSelected ? 'text-white' : cat.textColor
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Questions for Selected Category */}
                {selectedCategory && (
                  <View className="gap-2">
                    {questionCategories
                      .find((c) => c.id === selectedCategory)
                      ?.questions.map((q) => (
                        <Pressable
                          key={q}
                          onPress={() => setInput(q)}
                          className="px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        >
                          <Text className="text-sm text-slate-700">{q}</Text>
                        </Pressable>
                      ))}
                  </View>
                )}

                {/* Popular Questions (when no category selected) */}
                {!selectedCategory && (
                  <View className="gap-2">
                    <Text className="text-xs text-slate-400 text-center">
                      Popular questions:
                    </Text>
                    <View className="gap-2">
                      <Pressable
                        onPress={() =>
                          setInput(
                            "What's the fewest shifts I can work to hit my pension goal?"
                          )
                        }
                        className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl"
                      >
                        <Text className="text-sm text-slate-700">
                          {'\ud83c\udfaf'} What's the fewest shifts I can work to hit my
                          pension goal?
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setInput(
                            'If I take August off, can I still make $120k?'
                          )
                        }
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl"
                      >
                        <Text className="text-sm text-slate-700">
                          {'\ud83c\udfd6\ufe0f'} If I take August off, can I still make $120k?
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setInput('What are the overtime rules?')
                        }
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl"
                      >
                        <Text className="text-sm text-slate-700">
                          {'\u23f0'} What are the overtime rules?
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setInput(
                            "What's the best job for maximizing my weekly earnings?"
                          )
                        }
                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl"
                      >
                        <Text className="text-sm text-slate-700">
                          {'\ud83d\udcb0'} What's the best job for maximizing my weekly
                          earnings?
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
        />
          </>
        )}

        {/* Input - only show in chat tab */}
        {chatTab === 'chat' && (
        <View className="px-4 py-3 border-t border-slate-200 bg-white">
          <View className="flex-row gap-2">
            <Pressable className="p-3 rounded-xl bg-slate-100">
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color="#64748b"
              />
            </Pressable>
            <View className="flex-1">
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                placeholder="Ask about rates, rules, or upload a pay stub..."
                placeholderTextColor="#94a3b8"
                returnKeyType="send"
                className="px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-700"
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!input.trim()}
              className={`p-3 rounded-xl ${
                input.trim() ? 'bg-blue-600' : 'bg-blue-600 opacity-50'
              }`}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
