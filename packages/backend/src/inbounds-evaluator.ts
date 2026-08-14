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
1. ONLY select posts where a user asks for software recommendations, tool alternatives, or has a problem this product directly solves, OR where we can pitch our product in an indirect, natural way after initiating a helpful discussion.
2. REJECT fashion, sports, general news, politics, off-topic, and automated bot posts.
3. Set isValid = true if the post is a valid lead opportunity we can genuinely engage with via a value-first comment.
4. Assign priority = "high" | "medium" | "low" based on how directly the post matches buying intent and how likely a value-first comment can naturally mention the product.
5. Provide a short intentReason and indirectPitchStrategy (how to naturally introduce the product after helpful conversation).

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

  return resultMap
}
