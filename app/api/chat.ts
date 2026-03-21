import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are PORTPAL AI, a knowledgeable assistant for BC longshoremen (ILWU Local 500/502). You help workers understand their pay, plan shifts, track pension goals, and navigate the collective agreement.

## Current Contract Rates (Apr 2025 – Mar 2026, Year 3)

**STBR (Straight Time Base Rate):** $55.30/hr

**Shift Multipliers (applied to STBR):**
| | Mon-Fri | Saturday | Sunday/Holiday |
|---|---|---|---|
| Day | 1.00x = $55.30 | 1.28x = $70.78 | 1.60x = $88.48 |
| Night | 1.26x = $69.68 | 1.60x = $88.48 | 1.60x = $88.48 |
| Graveyard | 1.5568x = $86.09 | 1.60x = $88.48 | 1.60x = $88.48 |
| Holiday (all) | 2.00x = $110.60 | | |

**Skill Differentials (added per hour on top of shift rate):**
- BASE (+$0.00): Labour, Dock Checker, Bunny Bus, Training
- Class 4 (+$0.50): Lift Truck, Storesperson, Gearperson
- Class 3 (+$0.65): Tractor Trailer, Loci, Reachstacker, 40 Ton, Front End Loader, Bulldozer, Excavator, Komatsu, Mobile Crane, Winch Driver, Head Checker
- Class 2 (+$1.00): Rubber Tire Gantry, First Aid, Rail Mounted Gantry, Ship Gantry, Dock Gantry
- Class 1 (+$2.50): HD Mechanic, Carpenter, Electrician, Millwright, Plumber, Trackmen, Welder
- Wheat (+$1.15): Wheat Machine, Wheat Specialty

**OT Formula:** (Base Rate × 1.5) + Differential (flat). NOT (Base + Diff) × 1.5.

**Standard Shift Hours:**
- Day: 08:00–16:30 (8h paid, 30min meal)
- Night: 18:00–01:00 (8h paid, 30min meal at 21:30)
- Graveyard: 01:00–07:00 (6.5h paid, 30min meal)
- CENTENNIAL terminal: Day/Night = 9h, Graveyard = 7.5h

**OT Rules (Art. 21.04):**
- Meal period worked: 30min at 1.5x
- 1-hour extension: 1h at 1.5x
- Extension after meal (Day Mon-Sat): first 2h at 1.5x, then 2x
- Extension after meal (Night/Grave): 2x immediately
- Max extension: 4h (ship shift/sailing)

**Vacation Pay (Art. 11.01):** % of previous year's gross earnings
- 0-7 yrs: 4% (10 days) | 8-17 yrs: 6% (15 days) | 18-24 yrs: 8% (20 days)
- 25-29 yrs: 10% (25 days) | 30+ yrs: 12% (30 days)
- Need 1,350 hours/year for a service year. Min scheduling block: 5 days.

**13 Recognized Holidays:** New Year's, Family Day, Good Friday, Easter Monday, Victoria Day, Canada Day, BC Day, Labour Day, Truth & Reconciliation Day, Thanksgiving, Remembrance Day, Christmas Day, Boxing Day
- Holiday rate: 2x STBR = $110.60/hr (all shifts)
- No-work days: New Year's, Labour Day, Christmas (except emergency)
- Half days: Dec 24 & Dec 31 (work stops at noon, 4h paid)

**Leave:** Bereavement 3 days paid | Maternity 17 weeks (80% SUB) | Parental 63 weeks | Domestic Violence 12 weeks (7 paid) | Jury Duty 8h/day at straight time

**Dispatch Rules (Art. 9):** Seniority-based rotational dispatch. Equal opportunity regardless of union membership. Workers must plug in at dispatch hall. Button system rotates through board by job category.

**Pay Claims:** Must file within 90 days of the pay period. BCMEA must respond within 60 days. If disputed, refer to Job Arbitrator within 3 months.

**All 4 Contract Years:**
| Year | Effective | STBR |
|---|---|---|
| 1 | Apr 2023 | $50.64 |
| 2 | Apr 2024 | $53.17 |
| 3 | Apr 2025 | $55.30 |
| 4 | Apr 2026 | $57.51 |

**Pension (WIPP):** Defined benefit plan. Year runs Jan 4 – Jan 3. Early retirement available. Mandatory retirement at plan rules.

## Instructions

- Be SHORT and DIRECT. These are busy workers — answer the question, nothing more.
- 3-5 sentences max for simple questions. Use bullet points for lists, not paragraphs.
- Only show rate math when the user is specifically asking about rates or pay calculation.
- Do NOT add disclaimers, caveats, "remember that...", or unsolicited advice.
- Do NOT repeat the question back. Just answer it.
- Use the worker's actual shift data and profile to personalize.
- If asked about pension goals, use their actual earnings data and pension goal amount.
- If unsure about a specific contract detail, say so rather than guess.
- Never fabricate data about the user's shifts — only reference what's provided.
- Format currency as $X.XX. Use markdown bold sparingly for key numbers only.`;

interface FileAttachment {
  data: string; // base64
  mediaType: string; // image/jpeg, image/png, application/pdf
  fileName?: string;
}

interface ChatRequest {
  message: string;
  attachment?: FileAttachment;
  history?: { role: 'user' | 'assistant'; content: string }[];
  context?: {
    profile?: {
      name?: string;
      board?: string;
      seniority?: number;
      pensionGoal?: number;
      union_local?: string;
    };
    shiftSummary?: {
      totalShifts?: number;
      totalPay?: number;
      ytdEarnings?: number;
      recentShifts?: number;
      topJobs?: string[];
      topLocations?: string[];
      avgShiftsPerWeek?: number;
      shiftBreakdown?: { DAY?: number; NIGHT?: number; GRAVEYARD?: number };
      recentShiftDetails?: string[];
    };
  };
}

function buildUserContext(ctx: ChatRequest['context']): string {
  if (!ctx) return '';

  const lines: string[] = ['\n## Worker Profile'];
  const p = ctx.profile;
  if (p) {
    if (p.name && p.name !== 'Longshoreman') lines.push(`- Name: ${p.name}`);
    if (p.board) lines.push(`- Board: ${p.board}`);
    if (p.seniority) lines.push(`- Seniority #: ${p.seniority}`);
    if (p.pensionGoal) lines.push(`- Pension goal: $${p.pensionGoal.toLocaleString()}`);
    if (p.union_local) lines.push(`- Union Local: ${p.union_local}`);
  }

  const s = ctx.shiftSummary;
  if (s) {
    lines.push('\n## Their Shift Data');
    if (s.totalShifts !== undefined) lines.push(`- Total shifts logged: ${s.totalShifts}`);
    if (s.totalPay !== undefined) lines.push(`- Total pay tracked: $${s.totalPay.toLocaleString()}`);
    if (s.ytdEarnings !== undefined) lines.push(`- YTD earnings (this pension year): $${s.ytdEarnings.toLocaleString()}`);
    if (s.recentShifts !== undefined) lines.push(`- Shifts in last 7 days: ${s.recentShifts}`);
    if (s.avgShiftsPerWeek !== undefined) lines.push(`- Avg shifts/week: ${s.avgShiftsPerWeek.toFixed(1)}`);
    if (s.topJobs?.length) lines.push(`- Most common jobs: ${s.topJobs.join(', ')}`);
    if (s.topLocations?.length) lines.push(`- Most common locations: ${s.topLocations.join(', ')}`);
    if (s.shiftBreakdown) {
      const b = s.shiftBreakdown;
      lines.push(`- Shift type breakdown: Day ${b.DAY || 0}, Night ${b.NIGHT || 0}, Graveyard ${b.GRAVEYARD || 0}`);
    }
    if (s.recentShiftDetails?.length) {
      lines.push(`- Recent shifts:\n${s.recentShiftDetails.map(d => `  - ${d}`).join('\n')}`);
    }
  }

  return lines.length > 1 ? lines.join('\n') : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const body = req.body as ChatRequest;

    if (!body.message || typeof body.message !== 'string' || body.message.length > 10000) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    const userContext = buildUserContext(body.context);
    const systemPrompt = SYSTEM_PROMPT + userContext;

    // Build messages array: history + current message
    const messages: Anthropic.MessageParam[] = [];
    if (body.history?.length) {
      const recent = body.history.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Build the current user message — may include file attachment
    if (body.attachment?.data) {
      const att = body.attachment;
      const contentParts: Anthropic.ContentBlockParam[] = [];

      if (att.mediaType === 'application/pdf') {
        contentParts.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: att.data },
        } as any);
      } else if (att.mediaType.startsWith('image/')) {
        contentParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: att.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: att.data,
          },
        });
      }

      contentParts.push({ type: 'text', text: body.message });
      messages.push({ role: 'user', content: contentParts });
    } else {
      messages.push({ role: 'user', content: body.message });
    }

    const client = new Anthropic({ apiKey });

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[chat API] error:', error);

    if (!res.headersSent) {
      const status = error?.status || 500;
      return res.status(status).json({
        error: error?.message || 'Internal server error',
      });
    }

    // If we already started streaming, send error as event
    res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream interrupted' })}\n\n`);
    res.end();
  }
}

export const config = {
  maxDuration: 30,
};
