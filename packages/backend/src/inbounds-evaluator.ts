import { callAI, type AIProvider } from './ai.js'

export interface RawPostCandidate {
  id: string
  title: string
  body: string
  author: string
  url: string
  subreddit: string
  score: number
  commentCount: number
  createdUtc: number
  channel?: 'reddit' | 'twitter' | 'linkedin'
}

export interface EvaluatedLead {
  id: string
  isValid: boolean
  priority: 'high' | 'medium' | 'low'
  intentReason: string
  indirectPitchStrategy?: string
}

export interface ProjectContext {
  name: string
  url?: string | null
  description: string
  targetAudience?: string | null
}

const MAX_BATCH_CHARS = 5000 // Limit total character payload per AI request
const MAX_BATCH_COUNT = 8    // Max posts evaluated per AI prompt call

/**
 * Unambiguous ad signals. Deliberately narrow to avoid dropping genuine
 * buyers (e.g. "just launched, how do I market it?" is a real lead, so
 * launch words alone are NOT here).
 */
const PROMO_PATTERNS: RegExp[] = [
  /check out (my|our|this) (app|tool|product|service|startup|website|site)/i,
  /link in bio/i,
  /download (now|the app|our app|my app)/i,
  /available (on|at) the (app store|play store)/i,
  /\b(code \w+|promo code|discount code).{0,20}(for|off|at checkout)/i,
  /affiliate (link|partner|program)/i,
  /(grab|claim) yours (now|today|before)/i,
  /\bbeta( is| now)? (open|live|launched|available)\b/i,
  /\bsign[ -]?up (now|today|for free)\b/i,
  /\b(dm|message) me (for|to get|to grab)/i,
]

function isPromotionalPost(title: string, body?: string | null): boolean {
  const text = `${title}\n${body || ''}`.toLowerCase()
  return PROMO_PATTERNS.some((re) => re.test(text))
}

/**
 * Groups raw posts into character-budgeted batches and evaluates lead validity with AI.
 */
export async function evaluatePostsBatchWithAI(
  rawPosts: RawPostCandidate[],
  project: ProjectContext,
  aiOptions: { provider: AIProvider; apiKey: string },
): Promise<Map<string, EvaluatedLead>> {
  const resultMap = new Map<string, EvaluatedLead>()
  if (rawPosts.length === 0) {
    console.log('[Evaluator] 🔵 No raw posts to evaluate, skipping AI calls')
    return resultMap
  }

  console.log(`[Evaluator] 📦 Total candidates: ${rawPosts.length}`)

  // Construct character-budgeted batches to avoid overwhelming LLM
  const batches: RawPostCandidate[][] = []
  let currentBatch: RawPostCandidate[] = []
  let currentChars = 0

  const MAX_POST_CHARS = 600

  for (const post of rawPosts) {
    const rawContent = `${post.title}\n${post.body || ''}`
    const trimmedBody = rawContent.length > MAX_POST_CHARS ? rawContent.slice(post.title.length).slice(0, MAX_POST_CHARS - post.title.length) + '...' : post.body
    const postLen = Math.min(rawContent.length, MAX_POST_CHARS)

    if (currentBatch.length >= MAX_BATCH_COUNT || currentChars + postLen > MAX_BATCH_CHARS) {
      if (currentBatch.length > 0) batches.push(currentBatch)
      currentBatch = [{ ...post, body: trimmedBody }]
      currentChars = postLen
    } else {
      currentBatch.push({ ...post, body: trimmedBody })
      currentChars += postLen
    }
  }
  if (currentBatch.length > 0) batches.push(currentBatch)

  console.log(`[Evaluator] 📊 Batched into ${batches.length} batch(es) (${MAX_BATCH_COUNT} posts or ${MAX_BATCH_CHARS} chars max per batch)`)

  const system = `You are a growth marketing AI evaluating social posts for lead opportunities.
Product Context:
- Name: ${project.name}
- Landing Page URL: ${project.url || 'N/A'}
- Description: ${project.description}
- Target Audience: ${project.targetAudience || 'Indie hackers, founders, digital marketers'}

Strict Selection Rules:
1. ONLY select posts where a user genuinely ASKS for a recommendation or alternative, or states a PROBLEM this product directly solves — and where we can engage with a value-first comment that can naturally (indirectly) mention the product.
2. REJECT self-promotional and advertising posts. These are ads, NOT leads: the AUTHOR is promoting/hyping/announcing their own app, product, service, or content. Watch for: launch announcements ("we just launched", "excited to announce"), "check out my/our app", "link in bio", "download now", "DM me for the link", open-beta invites, giveaways, promo codes, affiliate links, "our tool does X", or any post whose purpose is to drive signups/downloads rather than ask a question or state a problem.
3. REJECT fashion, sports, general news, politics, off-topic, low-effort, and automated bot posts.
4. Set isValid = true ONLY for genuine buying-intent or problem-seeking posts. NEVER approve an ad or self-promotional post, even if it mentions a similar product — the poster is the seller, not a buyer.
5. Assign priority = "high" | "medium" | "low" based on how directly the post matches buying intent.
6. Provide a short intentReason and indirectPitchStrategy (how to naturally introduce the product after helpful conversation).
7. When in doubt, REJECT.

Note: Score and comment counts may be unavailable (reported as 0) depending on the data source. Judge posts purely on content and expressed intent, never on score or comment counts.`

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const postsText = batch
      .map(
        (p, i) =>
          `[Item #${i + 1}] ID: ${p.id} | Channel: ${p.channel || 'reddit'}\nTitle: ${p.title}\nBody: ${p.body}`,
      )
      .join('\n---\n')

    const prompt = `Evaluate the following posts:\n${postsText}\n\nReturn ONLY a valid JSON array of objects for posts with isValid == true:\n[\n  {\n    "id": "post_id",\n    "isValid": true,\n    "priority": "high",\n    "intentReason": "User explicitly asking for Reddit marketing tools",\n    "indirectPitchStrategy": "Provide tips on Reddit organic reach first, then naturally mention OpenCMO as the tool we built"\n  }\n]`

    console.log(`[Evaluator] 🤖 Batch ${i + 1}/${batches.length} - ${batch.length} posts, calling AI...`)

    try {
      const responseText = await callAI({
        provider: aiOptions.provider,
        apiKey: aiOptions.apiKey,
        prompt,
        system,
      })

      const match = responseText.match(/\[[\s\S]*\]/)
      if (match) {
        const evaluatedList: EvaluatedLead[] = JSON.parse(match[0])
        const approvedCount = evaluatedList.filter((item) => item.isValid).length
        evaluatedList.forEach((item) => {
          if (item.isValid) {
            resultMap.set(item.id, item)
          }
        })
        console.log(`[Evaluator] ✅ Batch ${i + 1}/${batches.length} - ${approvedCount} approved, total approved so far: ${resultMap.size}`)
      } else {
        console.log(`[Evaluator] ⚠️  Batch ${i + 1}/${batches.length} - no valid JSON in response, 0 approved`)
      }
    } catch (err) {
      console.error(`[Evaluator] 🔴 Batch ${i + 1}/${batches.length} - AI call failed:`, err)
    }
  }

  console.log(`[Evaluator] 🏁 Done - ${resultMap.size}/${rawPosts.length} total approved`)

  // Safety net: force-drop LLM-approved posts that are unambiguous advertisements
  const postById = new Map(rawPosts.map((p) => [p.id, p]))
  let droppedPromo = 0
  for (const id of [...resultMap.keys()]) {
    const post = postById.get(id)
    if (post && isPromotionalPost(post.title, post.body)) {
      resultMap.delete(id)
      droppedPromo++
      console.log(`[Evaluator] 🗑️ Safety net dropped promotional post ${id}: "${post.title.slice(0, 60)}"`)
    }
  }
  if (droppedPromo > 0) {
    console.log(`[Evaluator] 🗑️ Safety net dropped ${droppedPromo} promotional post(s)`)
  }

  return resultMap
}
