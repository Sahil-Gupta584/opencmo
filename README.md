# OpenCMO

OpenCMO is an open-source, AI-powered growth marketing tool that listens for buying intent across Reddit, X (Twitter), and LinkedIn. It helps you discover users asking for software recommendations, tool alternatives, or solutions to problems your product directly solves, enabling you to pitch your product naturally.

## 🚀 Features

- **Multi-Channel Monitoring:** Scans Reddit, X for buying intent.
- **AI-Powered Evaluation:** Uses AI to evaluate posts and strictly select genuine leads.
- **Bring Your Own Key (BYOK):** Supports OpenAI, Anthropic (Claude), and Google Gemini.
- **Automated Background Polling:** Fetches and evaluates leads on a recurring schedule.
- **Modern Tech Stack:** Built with TanStack Start, React 19, Express, oRPC, PostgreSQL (Prisma), Tailwind CSS v4, HeroUI, Better-Auth, and Dodo Payments.

## 🛠️ Self-Hosting Guide

OpenCMO is 100% open-source under the MIT license and can be easily self-hosted on your own infrastructure.

### Prerequisites

- **Node.js**: v22 or higher
- **Database**: PostgreSQL (e.g., Supabase, Neon, or local Postgres)
- **Package Manager**: npm

### 1. Clone the Repository

```bash
git clone https://github.com/Sahil-gupta584/opencmo.git
cd opencmo
```

### 2. Install Dependencies

Install all dependencies across the monorepo workspaces:

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory based on `.env.example`.

Required core variables:
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@host:5432/postgres?schema=opencmo"

# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
VITE_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=generate_a_random_secret_string

# Base Site URL
SITE_URL=http://localhost:3000

# API Configuration
API_PORT=5001
VITE_API_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:3000,http://localhost:5001

# Shared secret for the scheduled inbound-fetch cycle
CRON_SECRET=opencmo-cron-s3cret-change-me
```

Additional optional features (Auth, Payments, Social Scrapers) require their respective API keys (e.g., Google OAuth, Dodo Payments, Resend, RapidAPI for X). See `.env.example` for details.

### 4. Database Setup

Generate the Prisma client and apply the migrations to your PostgreSQL database:

```bash
# Generate the Prisma client
npm run db:generate

# Apply migrations to your database
# (If this is a fresh database, use 'npm run db:migrate -- --name baseline')
npm run db:deploy
```

### 5. Running Locally

Start the development server (runs both the web frontend on port `3000` and the API backend on port `5001`):

```bash
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

### 6. Background Jobs (Cron)

OpenCMO uses scheduled background jobs to fetch and evaluate leads. In production, you need to set up an external cron service (like GitHub Actions, Vercel Cron, or a standard crontab) to send a `POST` request to the following API endpoints on a schedule:

- **Fetch Leads:** `POST https://your-api.com/api/rpc/runFetchCycle` (e.g., every 2 hours)
- **Generate Content:** `POST https://your-api.com/api/rpc/runDailyContentCycle` (e.g., daily)

**Important:** You must include your `CRON_SECRET` in the headers to authenticate the cron job:
```bash
curl -X POST https://your-api.com/api/rpc/runFetchCycle \
  -H "x-cron-secret: you-secret"
```

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
