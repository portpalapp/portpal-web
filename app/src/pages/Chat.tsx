import { useState } from 'react'
import { Send, Upload, FileText, Book, Newspaper, Bot, User, Target, TrendingUp, Calendar, Zap } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function Chat() {
  const { profile } = useProfile()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey ${profile.name.split(' ')[0]}! I'm your PORTPAL AI. I can analyze your work patterns and help you optimize for your goals.\n\nAsk me about:\n• 🎯 Pension goal strategies\n• 📊 Work pattern analysis\n• 💰 Job & shift comparisons\n• 📅 Time-off planning\n\nWhat would you like to know?`
    }
  ])
  const [input, setInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const questionCategories = [
    {
      id: 'pension',
      icon: Target,
      label: 'Pension Goals',
      color: 'bg-blue-100 text-blue-600',
      questions: [
        "Fewest shifts to hit my pension goal?",
        "If I take August off, can I still make it?",
        "What if I only work day shifts?",
      ]
    },
    {
      id: 'optimize',
      icon: TrendingUp,
      label: 'Optimize Earnings',
      color: 'bg-green-100 text-green-600',
      questions: [
        "Best job for maximizing weekly pay?",
        "Night vs graveyard - which pays more overall?",
        "What's my highest earning potential this month?",
      ]
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: 'Schedule Planning',
      color: 'bg-purple-100 text-purple-600',
      questions: [
        "Can I take 2 weeks off and still hit $120k?",
        "How many shifts/week do I need for pension?",
        "What's the minimum I can work in December?",
      ]
    },
    {
      id: 'patterns',
      icon: Zap,
      label: 'My Patterns',
      color: 'bg-orange-100 text-orange-600',
      questions: [
        "What's my most common job assignment?",
        "Which terminal do I work most?",
        "Am I on track vs last year?",
      ]
    },
  ]

  const quickActions = [
    { icon: FileText, label: 'Upload Pay Stub', color: 'bg-orange-100 text-orange-600' },
    { icon: Book, label: 'Collective Agreement', color: 'bg-blue-100 text-blue-600' },
    { icon: Newspaper, label: 'Industry News', color: 'bg-green-100 text-green-600' },
  ]

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    // More sophisticated AI responses
    const lowerInput = input.toLowerCase()
    let responseContent = ""

    if (lowerInput.includes('fewest') || lowerInput.includes('minimum') || lowerInput.includes('least')) {
      responseContent = `📊 **Minimum Shifts Analysis**\n\nTo hit your $120k pension goal, here's the breakdown:\n\n**Optimal Strategy (HD Mechanic + Weekends):**\n• Rate: $91.55/hr (night) + weekend premiums\n• ~142 shifts total\n• That's ~3 shifts/week for the year\n\n**Your Current Pattern (TT mixed shifts):**\n• Avg ~$580/shift\n• Need ~207 shifts\n• ~4 shifts/week\n\n**Fewest possible (all graveyard weekends):**\n• ~118 shifts at ~$1,015/shift\n• But limited availability\n\n💡 Want me to build a custom schedule based on your seniority #${profile.seniority}?`
    }
    else if (lowerInput.includes('august') || lowerInput.includes('month off') || lowerInput.includes('take off')) {
      responseContent = `📅 **Time Off Analysis**\n\nIf you take August off (4 weeks):\n\n**Current pace:** ~$2,800/week\n**Lost earnings:** ~$11,200\n\n**To still hit $120k:**\n• Need to make up ~$1,020/week extra\n• Work 1 extra shift/week before & after\n• Or: prioritize weekend/graveyard shifts\n\n**Recommended approach:**\n1. Front-load May-July with 5 shifts/week\n2. Take August off guilt-free\n3. Resume normal 4 shifts/week Sept-Dec\n\n✅ Yes, it's doable! You'd need to bank ~$67k by end of July.`
    }
    else if (lowerInput.includes('only day') || lowerInput.includes('day shift')) {
      responseContent = `☀️ **Day Shifts Only Analysis**\n\nIf you only work day shifts:\n\n**Weekday rate (TT):** $55.95/hr × 8h = $447/day\n**Weekend rate:** $71.43/hr × 8h = $571/day\n\n**To hit $120k with days only:**\n• Need ~230 day shifts\n• That's 4.4 shifts/week all year\n• Compare to 3.5 with mixed shifts\n\n**Trade-off:**\n• +26 extra shifts/year\n• But better work-life balance\n• Easier on the body long-term\n\n💡 Consider: 3 weekdays + 1 Saturday = good balance`
    }
    else if (lowerInput.includes('best job') || lowerInput.includes('maximiz')) {
      responseContent = `💰 **Highest Paying Jobs Analysis**\n\nBased on hourly rate + typical hours:\n\n**Top 5 for weekly earnings:**\n1. HD Mechanic (night) - $648/shift\n2. Electrician (night) - $648/shift\n3. RTG (graveyard weekend) - $634/shift\n4. Ship Gantry (night) - $567/shift\n5. Trainer (any) - $590/shift avg\n\n**At your seniority (#${profile.seniority}):**\n• HD Mechanic: Rare, need certification\n• RTG: Good availability at DELTAPORT\n• Ship Gantry: Solid choice, regular work\n\n🎯 Realistic best: Ship Gantry nights at CENTENNIAL (9h shifts = $630/shift)`
    }
    else if (lowerInput.includes('night vs graveyard') || lowerInput.includes('graveyard')) {
      responseContent = `🌙 **Night vs Graveyard Comparison**\n\n**Night Shift (Mon-Fri TT):**\n• Rate: $70.32/hr\n• Hours: 8h (9h at CENT)\n• Per shift: $562 - $632\n\n**Graveyard (Mon-Fri TT):**\n• Rate: $86.70/hr\n• Hours: 6.5h (7.5h at CENT)\n• Per shift: $563 - $650\n\n**Verdict:**\n• Graveyard pays ~$23/hr MORE\n• But 1.5h fewer hours\n• Net: About the same per shift!\n• CENTENNIAL graveyard wins (+$18/shift)\n\n💡 Graveyard = higher rate, shorter shift. Pick based on lifestyle preference.`
    }
    else if (lowerInput.includes('track') || lowerInput.includes('last year') || lowerInput.includes('compare')) {
      responseContent = `📈 **Your Progress Analysis**\n\n**This Year vs Last Year:**\n• YTD: $${(profile.pensionGoal * 0.15).toLocaleString()} earned\n• Same time last year: ~$16,800\n• You're ${Math.random() > 0.5 ? 'ahead' : 'slightly behind'} by ~$${Math.floor(Math.random() * 2000)}\n\n**Your patterns:**\n• Most common: TT Rail at CENTENNIAL\n• Avg shifts/week: 3.8\n• Preferred: Night shifts (62%)\n\n**Trend:**\n• Earnings up 8% vs last year\n• Working 0.5 fewer shifts/week\n• Higher-paying jobs more often\n\n🎯 On track for pension goal by mid-November!`
    }
    else if (lowerInput.includes('2 week') || lowerInput.includes('two week')) {
      responseContent = `🏖️ **2 Weeks Off Analysis**\n\nIf you take 2 weeks off:\n\n**Impact:**\n• Missed earnings: ~$5,600\n• New weekly target: +$215/week\n• That's just 0.4 extra shifts/week\n\n**Easy to recover:**\n• Add 1 Saturday shift per month\n• Or work 1 graveyard instead of day\n• Or pick up 1 extra shift in busy months\n\n✅ **Verdict:** Very doable! Take the vacation.\n\n💡 Pro tip: Take time off in slower dispatch months (Feb, Sept) when jobs are harder to get anyway.`
    }
    else if (lowerInput.includes('common') || lowerInput.includes('most')) {
      responseContent = `📊 **Your Work Pattern Analysis**\n\n**Most Common Assignments:**\n1. TT Rail @ CENTENNIAL (34%)\n2. TT Ship @ DELTAPORT (22%)\n3. Ship Gantry @ VANTERM (18%)\n4. RTG @ DELTAPORT (12%)\n5. Other (14%)\n\n**Shift Distribution:**\n• Day: 28%\n• Night: 52%\n• Graveyard: 20%\n\n**Insights:**\n• You favor night shifts (good for earnings)\n• CENTENNIAL = longer hours = more pay\n• TT Rail is your bread & butter\n\n💡 Your pattern is solid for earnings. Consider adding more weekend shifts for a boost.`
    }
    else if (lowerInput.includes('night')) {
      responseContent = "🌙 **Night Shift Rates (Mon-Fri)**\n\nFor TRACTOR TRAILER:\n• Base rate: $69.67/hr\n• Differential: +$0.65 (Class 3)\n• Your rate: **$70.32/hr**\n• OT rate: $105.48/hr (1.5x)\n\n**By location:**\n• CENTENNIAL: 9 hours = $632/shift\n• VANTERM/DELTAPORT: 8 hours = $562/shift\n\n💡 CENTENNIAL night TT = best value for your time."
    }
    else if (lowerInput.includes('saturday') || lowerInput.includes('weekend')) {
      responseContent = "📅 **Weekend Premium Rates**\n\n**Saturday (TT example):**\n• Day: $71.43/hr (vs $55.95 weekday)\n• Night: $89.13/hr\n\n**Sunday (all shifts):**\n• All shifts: $89.13/hr base + differential\n\n**Weekend bonus:**\n• +28% over weekday day shift\n• +27% over weekday night shift\n\n💰 One Saturday = almost 1.3 weekday shifts in earnings!"
    }
    else {
      responseContent = `I can help you analyze that! Here are some things I can calculate:\n\n📊 **Earnings Optimization:**\n• Best jobs for your seniority\n• Shift comparisons (day/night/graveyard)\n• Weekly/monthly earning projections\n\n🎯 **Pension Planning:**\n• Minimum shifts needed\n• Time-off impact analysis\n• Custom schedules to hit $120k\n\n📅 **Pattern Analysis:**\n• Your most common assignments\n• Comparison to last year\n• Trends in your earnings\n\nTry asking something specific like "What if I only work TT day shifts?" or "Can I take July off?"`
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
    }

    setMessages([...messages, userMessage, assistantMessage])
    setInput('')
    setSelectedCategory(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <h1 className="text-xl font-bold text-slate-800">Ask PORTPAL</h1>
        <p className="text-xs text-slate-500">AI-powered pay & contract assistant</p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {quickActions.map(action => (
            <button
              key={action.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap ${action.color}`}
            >
              <action.icon size={16} />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {/* Category-based Questions */}
        {messages.length <= 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 text-center font-medium">What do you want to know?</p>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {questionCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : cat.color
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Questions for Selected Category */}
            {selectedCategory && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {questionCategories
                  .find(c => c.id === selectedCategory)
                  ?.questions.map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      {q}
                    </button>
                  ))}
              </div>
            )}

            {/* Popular Questions (when no category selected) */}
            {!selectedCategory && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 text-center">Popular questions:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setInput("What's the fewest shifts I can work to hit my pension goal?")}
                    className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                  >
                    🎯 What's the fewest shifts I can work to hit my pension goal?
                  </button>
                  <button
                    onClick={() => setInput("If I take August off, can I still make $120k?")}
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                  >
                    🏖️ If I take August off, can I still make $120k?
                  </button>
                  <button
                    onClick={() => setInput("What's the best job for maximizing my weekly earnings?")}
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300"
                  >
                    💰 What's the best job for maximizing my weekly earnings?
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <button className="p-3 rounded-xl bg-slate-100 text-slate-500">
            <Upload size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about rates, rules, or upload a pay stub..."
              className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
