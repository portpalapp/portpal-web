# PORTPAL News Agent — Mac Mini Setup Instructions

## What This Is

You are setting up a 24/7 news aggregation agent for PORTPAL, a shift-tracking app for BC longshoremen. This agent runs two processes:

1. **Fetcher** — Checks 13 news sources (ILWU, BCMEA, Port of Vancouver, etc.) every 90 minutes via RSS feeds and HTML scraping
2. **Enricher** — Every 6 hours, sends new articles to Claude Sonnet for summarization, relevance scoring, and a "what this means for workers" blurb

Articles are written to Supabase (the `news_articles` table). The PORTPAL web app at portpal-web.vercel.app reads from this table and displays them on the /news page.

## Prerequisites

- macOS with Node.js 20+ installed (use `fnm` or `nvm` if needed)
- Git access to the repo
- Internet connection (stays on 24/7)

## Credentials Needed

You need three values for the `.env` file:

1. **SUPABASE_URL**: `https://qcnozghkxbnlofahaqig.supabase.co`
2. **SUPABASE_SERVICE_KEY**: The service_role key from Supabase Dashboard → Settings → API → service_role (secret). This is NOT the anon/public key. It starts with `eyJ...` and is needed because the agent writes to the database (bypasses RLS).
3. **ANTHROPIC_API_KEY**: `(your Anthropic API key — same one used for the Vercel ANTHROPIC_API_KEY env var)`

## Setup Steps

### Step 1: Clone the repo

```bash
git clone https://github.com/portpalapp/portpal-web.git ~/portpal
cd ~/portpal/news-agent
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Create the .env file

```bash
cp .env.example .env
```

Then edit `.env` and fill in the three credentials above. The file should look like:

```
SUPABASE_URL=https://qcnozghkxbnlofahaqig.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (paste the full service_role key here)
ANTHROPIC_API_KEY=(your Anthropic API key — same one used for the Vercel ANTHROPIC_API_KEY env var)
FETCH_INTERVAL_MIN=90
ENRICH_INTERVAL_MIN=360
ENRICH_BATCH_SIZE=20
RELEVANCE_THRESHOLD=20
LOG_DIR=./logs
```

### Step 4: Verify it compiles

```bash
npx tsc --noEmit
```

Should complete with no errors.

### Step 5: Test the fetcher manually (optional)

```bash
npx ts-node src/fetcher/index.ts
```

Watch the output — it should connect to Supabase, check each news source, and log any articles found. Press Ctrl+C to stop after the first cycle.

### Step 6: Test the enricher manually (optional)

```bash
npx ts-node src/enricher/index.ts
```

This will pick up any articles with status `fetched` and send them to Claude for processing. Press Ctrl+C after the first cycle.

### Step 7: Install pm2 and start both processes

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

Verify both are running:

```bash
pm2 status
```

You should see two processes: `portpal-news-fetcher` (online) and `portpal-news-enricher` (online).

### Step 8: Set up auto-start on boot

```bash
pm2 save
pm2 startup
```

Follow the instructions pm2 prints (it will give you a command to copy-paste with sudo). This ensures both processes restart automatically if the Mac Mini reboots.

### Step 9: Verify articles are flowing

After the first fetch cycle (up to 90 minutes), check Supabase:

```bash
# Quick check via curl
curl -s "https://qcnozghkxbnlofahaqig.supabase.co/rest/v1/news_articles?select=id,raw_title,status&limit=5" \
  -H "apikey: sb_publishable_i10LTCrx6XGeJTXKIFXSsQ_1ISYAfcN" | head -20
```

Or check the Supabase dashboard → Table Editor → `news_articles`.

After the first enrichment cycle (up to 6 hours, or run manually per Step 6), articles with `status = 'published'` will appear on https://portpal-web.vercel.app/#/news.

## Monitoring

```bash
pm2 status              # Are both processes running?
pm2 logs                # Live log output from both processes
pm2 logs portpal-news-fetcher    # Just the fetcher
pm2 logs portpal-news-enricher   # Just the enricher
pm2 monit               # CPU/memory dashboard
```

## Troubleshooting

- **Process keeps restarting**: Check `pm2 logs` for errors. Common issues: wrong API key, Supabase service key is actually the anon key, network issues.
- **No articles appearing**: Run the fetcher manually (`npx ts-node src/fetcher/index.ts`) and watch the output. Check if sources are returning HTML/RSS as expected.
- **Articles stuck in "fetched" status**: The enricher runs every 6 hours. Run it manually to process immediately: `npx ts-node src/enricher/index.ts`
- **Claude API errors**: Check the API key is valid and has credits. The enricher logs errors per-article and marks them as `status = 'error'`.

## Architecture

```
news-agent/
  src/
    config.ts              # 13 news sources, relevance keywords
    db.ts                  # Supabase client (service role), typed helpers
    logger.ts              # Structured JSON logging
    fetcher/
      index.ts             # Main loop: check sources every 90 min
      rss-fetcher.ts       # Parse RSS/Atom feeds
      html-fetcher.ts      # Scrape HTML pages for article links
    enricher/
      index.ts             # Main loop: enrich articles every 6 hrs
      prompts.ts           # Claude system prompt + article formatting
  ecosystem.config.js      # pm2 process config
  .env                     # Credentials (not in git)
```

## Costs

- Claude API: ~$6/month (Sonnet, ~50 articles/day)
- Supabase: Free tier
- Mac Mini electricity: ~$6/month
- Total: ~$12/month
