import { z } from 'zod'

export const SaveApiConfigSchema = z.object({
  defaultProvider: z.enum(['openai', 'anthropic', 'gemini']),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  geminiKey: z.string().optional(),
  twitterBearerToken: z.string().optional(),
})

export const AnalyzeProductSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
})

export const CreateProjectSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  targetAudience: z.string().optional(),
  keywords: z.array(z.string()),
  targetSubreddits: z.array(z.string()),
  socialPostTypes: z.array(z.string()).optional(),
})

export const GenerateDraftSchema = z.object({
  projectId: z.string(),
  subreddit: z.string(),
  prompt: z.string().optional(),
})

export const RefreshSubredditsSchema = z.object({
  projectId: z.string(),
})

export const FetchInboundsSchema = z.object({
  projectId: z.string(),
})

export const ListThreadsSchema = z.object({
  projectId: z.string(),
  isDone: z.boolean().optional(),
  channel: z.enum(['all', 'reddit', 'twitter', 'linkedin']).optional(),
})

export const ListThreadCountsSchema = z.object({
  projectId: z.string(),
})

export const UpdateThreadStatusSchema = z.object({
  threadId: z.string(),
  isDone: z.boolean(),
})

export const GenerateThreadReplySchema = z.object({
  threadId: z.string(),
})

export const SaveNotificationPrefSchema = z.object({
  notifyNewLeads: z.boolean(),
})
