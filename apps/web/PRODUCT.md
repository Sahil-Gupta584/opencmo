# OpenCMO - Product Specification

> **The open-source marketing OS for indie founders.**
> Grow on Reddit (and later everywhere) without overpaying, without spamming, and without getting banned.

---

## 1. What Is This?

OpenCMO is an open-source, bring-your-own-AI marketing platform built for indie founders and solo builders who can't afford $200/mo Taplio or $500/mo marketing agencies.

The core insight: **marketing is the hardest moat in the AI era.** Building is easy now. Distribution is everything. OpenCMO helps founders do Reddit marketing intelligently - finding buying-intent threads to reply to, and generating value-first posts that indirectly promote their product - without spamming, without getting banned, and without paying per-seat SaaS pricing.

**Inspired by:** mediafa.st, CrowdReply, Okara
**Monetization:** Open-source code + $5/mo or $39/mo hosted plans (bring your own AI API key)

---

## 2. Who Is It For?

**Primary user:** Solo founders / indie hackers running their own product

- They have a SaaS, tool, or product they want to grow
- They know Reddit is a goldmine but don't know how to do it without getting banned
- They can't afford expensive marketing tools
- They have a Google AI Studio / OpenAI / Anthropic API key
- They run **multiple products** and want one place to manage marketing for all of them

---

## 3. Core Mental Model: Inbound vs Outbound

Every feature in OpenCMO maps to one of two motions:

| Motion | What it means | Example |
|---|---|---|
| **Inbound** | Someone is already talking - you join the conversation | Reply to "what's a good tool for X?" |
| **Outbound** | You create the conversation - value-first, non-spammy | Post a tutorial that naturally features your product |

Just replying to threads is not enough. The real loop is:
**find → engage → create → monitor → repeat**

The **Mentions** page closes the loop - you see what people are saying about you after you've engaged.

---

## 4. Features

### 4.1 🏠 Dashboard (Project Selector)

**What it does:** The home screen after login. Shows all of the user's products as cards. Users can run multiple products on the same account - each is fully independent.

**What it shows:**
- Grid of product cards: name, URL, description, quick stats (inbounds pending, subreddits watched, drafts)
- **"+ Add Product"** button - triggers the add-product flow
- API key warning banner if no AI key is configured yet
- Each card's **"View Inbounds"** button → navigates into that product's Inbounds page

**Add Product flow:**
1. User enters their SaaS URL
2. AI scrapes the site, extracts: name, description, target audience, keywords, suggested subreddits
3. Project created in DB with subreddits auto-added to watch list
4. User lands on the project's Inbounds page

**Empty state:** Centered icon, "Add your first product" headline, CTA button.

---

### 4.2 📥 Inbounds

**What it does:** Monitors Reddit for threads where people have buying intent for your product. Shows them as a feed. You generate a reply, copy it, and post manually - human always in the loop.

**How threads are fetched (no Reddit API key needed):**
- Reddit's public `.json` endpoints: `reddit.com/r/{sub}/search.json?q={keyword}&sort=new&t=month&limit=100`
- **First fetch:** pulls last 30 days of threads matching project keywords × watched subreddits
- **Subsequent fetches:** cursor-based - only fetches threads with `created_utc` newer than the stored cursor
- If you miss 2 days, all threads accumulate in the feed - nothing is lost, nothing duplicated
- Reddit thread ID (`redditId`) is the dedup primary key - same thread can never appear twice
- **Polling schedule:** every 6 hours on the remote server (Express backend, to be built). For now: manual **"Fetch Now"** button in dev

**Thread status:** single `isDone` boolean
- `isDone = false` → active, needs attention
- `isDone = true` → completed, archived

**Per-thread actions:**
- **Generate Reply** - AI writes a contextual, helpful, non-spammy reply that naturally mentions the product where relevant
- **Copy Reply** - one-click copy to clipboard
- **View Thread** - opens Reddit thread in new tab
- **Mark as Completed** - sets `isDone = true`, thread moves to Completed tab

**Filters / Tabs:**
- Active | Completed
- Filter by intent score: High (>70) / Medium (40–70) / Low (<40)
- Filter by subreddit
- Sort by: Newest first | Highest intent first

**Intent scoring:**
- AI scores each thread 0–100 at fetch time
- Based on: explicit product-type questions, "looking for alternative", "recommend a tool", "how do I automate X" signals
- Stored in DB as `intentScore` - not re-computed on every load

**Future channels (same page, filter by source):**
- LinkedIn, X (Twitter), Hacker News, IndieHackers, Product Hunt

---

### 4.3 📣 Outbound Posts

**What it does:** AI generates value-first posts that indirectly promote your product. One great Reddit post can drive 10,000+ visitors. No other tool focuses on this.

**Why this matters:** Replying to threads is table stakes. The real moat is creating content that *teaches something useful* and happens to feature your product naturally - this is how most successful indie products grow on Reddit.

**Post types AI can generate:**

| Type | Description |
|---|---|
| **Show Reddit / Show HN** | "I built [product] because I was tired of [pain]" - founder story, authentic |
| **Tutorial post** | "How I automated X in 30 minutes" - product is the tool used |
| **Comparison post** | "I tried 5 tools for Y - here's what actually works" |
| **Value list** | "5 tips for Z" - product mentioned naturally in one tip |
| **Question post** | "What do you all use for X?" - drives discussion, you respond |
| **Roast me** | "I built X, tear it apart" - community engagement |

**Flow:**
1. Select a post type + target subreddit
2. AI generates 2–3 drafts using your product description + subreddit rules/culture
3. Each draft shows: Ban Sentinel risk score (0–100) + reasons + fix suggestions
4. User edits draft inline → clicks **Copy** → pastes manually on Reddit
5. Click **Mark as Posted** → saved in history with date + subreddit

**Ban Sentinel (risk scoring):**
- Checks: link density, self-promotion phrases ("check out my...", "buy now"), keyword stuffing
- Score 0–100: 🟢 Safe (<30) / 🟡 Caution (30–60) / 🔴 High Risk (>60)
- Shows specific flagged phrases and how to fix them

---

### 4.4 🔍 Subreddit Discovery

**What it does:** Given your product URL, AI finds and ranks the best subreddits to target - saving hours of manual research.

**Flow:**
1. Triggered automatically when a new product is added (or manually via "Refresh" button)
2. AI analyzes: product description, target audience, keywords
3. Returns ranked list with metadata per subreddit:
   - Name + subscriber count
   - Activity level (posts/day estimate)
   - Strictness rating: how aggressively mods remove promotional content
   - Self-promotion policy: allowed / conditional / not allowed
   - Relevance score to your product
4. User can **Add to Watch List** → feeds the Inbounds scanner
5. User can **Remove** a subreddit they don't want

**Note:** Subreddit metadata is fetched via Reddit's public `about.json` where possible, with AI fallback for restricted subs.

---

### 4.5 🔔 Mentions *(v2 - later)*

**What it does:** Aggregates brand mentions of your product across all social platforms into one feed, then AI auto-tags each mention with a category so you can triage at a glance. This closes the loop - you know what people are saying about you everywhere.

**Sources:** Reddit, X (Twitter), LinkedIn, HackerNews, IndieHackers, Product Hunt (same scraping infra as Inbounds - searches for your product name + URL)

**Default categories:**

| Category | What it catches |
|---|---|
| 🎉 Praise | Positive mentions, compliments, testimonials, love |
| 🐛 Bug Reports | Broken features, errors, "doesn't work" |
| 💡 Feature Requests | "Would be great if...", "I wish it could..." |
| 😤 Complaints | Negative feedback, frustrations, criticism |
| 🔖 Uncategorized | Low-confidence AI classification - needs manual review |

**User-managed custom categories:**
- Create a category with a **name** + **description** (description is fed to AI as classification context)
- Example: create "Pricing Feedback" with description "Mentions about pricing being too high, too low, or confusing"
- Reorder categories (affects display priority)
- Rename or delete categories (mentions in deleted category → Uncategorized)
- Manually reassigning a mention to a different category teaches the AI over time (future: fine-tuning loop)

**Per-mention actions:**
- **Reply** - opens the original post/thread in a new tab
- **Reassign category** - dropdown to move to a different category
- **Archive** - hide from main feed, kept in history

**How AI tagging works (async background job):**
1. New mention scraped → stored in DB with `category = null`
2. Background job picks it up → sends to AI: mention text + product description + full category list with descriptions
3. AI returns: `{ category: "Bug Reports", confidence: 0.87 }`
4. Confidence < 0.5 → tagged Uncategorized
5. DB updated with category + confidence score
6. UI updates live (or on next page load) - no blocking

---

### 4.6 🎯 Campaigns *(v2)*

**What it does:** Group your inbound replies + outbound posts into goal-based campaigns so you can see whether a focused push is working.

- Create campaign: name, goal (traffic / signups / brand awareness), start date, end date, target subreddits
- Add existing inbound replies and outbound posts to a campaign
- Progress view: threads replied, posts made, UTM clicks tracked
- UTM link generator: auto-generate `?utm_source=reddit&utm_campaign=<name>` links
- One product can have multiple campaigns ("Launch week", "Black Friday push", "Competitor migration")

---

### 4.7 📊 Analytics *(v2)*

- Thread reply history: every thread you replied to, date, which product, subreddit
- Post history: every outbound post created, date, subreddit, status (drafted / posted)
- UTM performance: connect Plausible or GA4 → see clicks per campaign
- Activity heatmap: how consistent your Reddit presence has been over time
- Top performing subreddits by engagement

---

### 4.8 ⚙️ Settings

**AI tab:**
- Select provider: Gemini (default/recommended), OpenAI, Anthropic
- Enter API key → stored AES-256 encrypted in DB
- Test connection button
- Note: Google AI Studio key works for free-tier testing

**Product tab (per project):**
- Edit name, URL, description, target audience, keywords
- These are fed into every AI prompt - keep them accurate for best results
- Keywords drive the Inbounds search queries

**Billing tab:**
- Current plan (Free / Indie / Pro)
- Upgrade / downgrade
- Manage subscription (Dodo Payments hosted portal)

**Notifications tab:**
- Email alerts for new high-intent inbounds (>70 score)
- Email reminders for scheduled outbound posts
- Weekly digest: summary of inbounds found + actions taken

---

## 5. Pages & Routes

```
/                       Landing page (public)
/pricing                Pricing page (public)
/login                  Auth - Google OAuth + magic link (public)

/dashboard              Project selector - list all user's products (protected)
/inbounds               Inbounds thread feed (protected)
/outbound               Outbound post generator (protected)
/subreddits             Subreddit discovery (protected)
/mentions               Brand mentions feed with AI categories (protected) - v2
/campaigns              Campaign manager (protected) - v2
/analytics              Analytics overview (protected) - v2
/settings               Settings → AI config (protected)
/settings/billing       Billing management (protected)
```

---

## 6. UI & Design System

### Visual Direction
- **Aesthetic:** Clean & professional - white/light, minimal, confident
- **Inspiration:** Stripe (polish), Notion (clarity), Beehiiv (indie warmth)
- **NOT:** Purple on dark, glowing borders, bento boxes, dashboard-for-everything, gradient text fills, grid backgrounds

### Color Palette

| Token | Hex | Use |
|---|---|---|
| Background | `#FAFAFA` | Page background |
| Surface | `#FFFFFF` | Cards, panels, sidebar |
| Border | `#E2E8F0` | Dividers, card borders |
| Text primary | `#0F172A` | Headlines, body copy |
| Text muted | `#64748B` | Labels, captions, placeholders |
| Accent (Indigo) | `#4F46E5` | Primary buttons, active nav, links |
| Success (Green) | `#10B981` | Completed status, low risk, praise |
| Warning (Amber) | `#F59E0B` | Medium risk, caution states |
| Danger (Red) | `#EF4444` | High risk, error states |

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** `font-bold tracking-tight`
- **Body:** `font-normal leading-relaxed`
- **Section labels:** `text-xs font-semibold uppercase tracking-widest text-slate-400` (Stripe-style)

### App Shell Layout
- **Left sidebar:** 220px wide, white background, `border-r border-slate-200`
- **Logo:** top of sidebar, indigo icon + "OpenCMO" wordmark
- **Nav items:** icon + label, active = `bg-indigo-50 text-indigo-700`, inactive = `text-slate-600 hover:bg-slate-50`
- **User section:** bottom of sidebar, avatar + name/email, dropdown with sign out
- **Mobile:** sidebar hidden behind hamburger menu overlay
- **Content area:** `flex-1 overflow-y-auto bg-slate-50`, inner content `max-w-5xl mx-auto px-6 py-8`

### Sidebar Nav Items (in order)
1. Dashboard (RiDashboardLine)
2. Inbounds (RiInboxLine)
3. Outbound (RiSendPlaneLine)
4. Subreddits (RiRedditLine)
5. Mentions (RiBellLine) - v2, show as "Coming soon" chip
6. Settings (RiSettingsLine)

### Component Style Rules
- **Cards:** `bg-white rounded-xl border border-slate-100 shadow-sm`
- **Primary buttons:** HeroUI `Button` `color="primary"` → indigo
- **Table/list buttons:** always `size="sm"`
- **Status chips:** HeroUI `Chip` with semantic colors (`color="success"`, `color="warning"`, etc.)
- **Inputs:** HeroUI `Input` component, label above field
- **Empty states:** centered, icon in `bg-slate-100 rounded-2xl` square, heading, subtext, CTA
- **Loading:** HeroUI `Spinner` centered in content area (not full-page overlay)
- **Banners/alerts:** `rounded-xl border px-4 py-3` with semantic border + bg color

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (Vite + React 19 SSR) |
| Router | TanStack Router - file-based routing at `src/routes/` |
| Server API | oRPC + Zod validation (`/api/rpc/*`) |
| Database | Prisma 7 + PostgreSQL (Supabase) |
| Auth | better-auth - magic link + Google OAuth |
| UI Components | HeroUI (`@heroui/react`) + Tailwind CSS v4 |
| Icons | `react-icons/ri` |
| Forms | react-hook-form + `@hookform/resolvers/zod` |
| AI | Vercel AI SDK - Gemini (primary), OpenAI, Anthropic (BYOK) |
| Payments | Dodo Payments - hosted checkout + webhook verification |
| Background jobs | Express server in `/backend` folder (to be built separately) |
| Import alias | `#/` → `./src/`, `@/` → `./src/` |

### Key Conventions
- **Never** edit `src/routeTree.gen.ts` manually - run `npm run generate-routes` after adding/renaming routes
- **Never** use `db push` - it is removed from package.json. All schema changes via `npm run db:migrate -- --name <descriptive-name>`
- Protected routes: get `user` from `Route.useRouteContext()`, never from `authClient.useSession()`
- Forms with >2 fields: always use react-hook-form + Zod schema at top of file
- All async calls: wrap in try/catch, log errors as `console.error('🔴 Operation failed:', err)`
- Keep route files under ~500 lines - if larger, convert to folder with `index.tsx` + `-components/` subfolder

---

## 8. Database - Key Models

```
User              → has many Projects, one UserApiConfig
Project           → has many RedditThreads, InboundCursors, ProjectSubreddits, ContentDrafts
RedditThread      → redditId (dedup key), isDone (bool), intentScore, generatedReply
InboundCursor     → per (projectId + subreddit + keyword) - stores lastSeenAt for cursor strategy
ProjectSubreddit  → subreddit name, subscribers, strictness, self-promotion policy
ContentDraft      → outbound post draft, subreddit, riskScore, status (DRAFT/POSTED)
UserApiConfig     → encrypted AI keys (AES-256), defaultProvider
```

---

## 9. Thread Fetching - Technical Design

```
Reddit public JSON (no API key):
  https://www.reddit.com/r/{sub}/search.json?q={keyword}&sort=new&t=month&limit=100

First fetch (when project is created or keyword added):
  → time window: last 30 days
  → fetch all matching threads
  → AI score each for intent (0–100)
  → store in DB as RedditThread (isDone = false)
  → save cursor = MAX(redditCreatedAt) per (projectId, subreddit, keyword)

Subsequent fetches (every 6h cron / "Fetch Now" button in dev):
  → load cursor from InboundCursor table
  → fetch only threads where created_utc > cursor
  → upsert by (projectId, redditId) - dedup is automatic
  → AI score new threads
  → update cursor = new MAX(redditCreatedAt)

Guarantees:
  → Thread never re-appears: dedup by redditId primary key
  → Nothing lost if user is away: cursor doesn't advance until fetch runs
  → Missed 3 days? All 3 days of threads waiting in Active tab
```

---

## 10. Pricing

| Feature | **Indie** `$5/mo` | **Pro** `$39/mo` |
|---|---|---|
| Platform Access | ✓ | ✓ |
| AI Usage | **Bring Your Own Key (BYOK)** | **Hosted AI Included** (No API key needed) |
| Products | 1 | 5 |
| Inbounds / month | 200 | Unlimited |
| Subreddits monitored | 10 | Unlimited |
| Background polling | ✓ every 6h | ✓ every 2h |
| Mentions page | ✓ | ✓ |
| Support | Email | Priority |

**Pricing philosophy:** Accessing the hosted platform requires a subscription. The **Indie ($5/mo)** plan lets users access the platform using their own AI API keys (BYOK). The **Pro ($39/mo)** plan includes hosted AI usage out of the box so users don't need to configure API keys. Self-hosting remains free via open-source code on GitHub.

---

## 11. Build Order

| Phase | What | Status | Notes |
|---|---|---|---|
| 1 | Landing page | ✅ Done | Full marketing page with hero, features, pricing |
| 2 | App shell (sidebar) + Dashboard | ✅ Done | Sidebar nav, project selector, multi-product cards |
| 3 | DB migration | ✅ Done | RedditThread + InboundCursor models live |
| 4 | **Inbounds page** | 🔨 Next | Thread feed, Fetch Now btn, Generate Reply, Mark Done |
| 5 | oRPC: fetchInbounds + updateThread | 🔨 Next | Reddit JSON fetch, cursor logic, isDone toggle |
| 6 | Outbound Posts page | - | Post type selector, Ban Sentinel, draft editor |
| 7 | Settings redesign | - | AI key config, product info tabs |
| 8 | Pricing page | - | Before public launch |
| 9 | Campaigns | - | v2 post-launch |
| 10 | Analytics | - | v2 post-launch |
| 11 | Mentions page | - | v2 - brand mention feed + AI category tagging |
| 12 | Express backend + cron | - | Replaces "Fetch Now" button with real polling |
| 13 | More channels | - | LinkedIn, X, HN → feeds Inbounds + Mentions |
