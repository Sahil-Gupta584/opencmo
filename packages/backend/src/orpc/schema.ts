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

export const UpdateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, 'Product name is required').optional(),
  url: z.string().url('Please enter a valid URL').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  targetAudience: z.string().optional(),
  keywords: z.array(z.string()).optional(),
})

export const RefreshSubredditsSchema = z.object({
  projectId: z.string(),
})

export const AddSubredditSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, 'Subreddit name is required'),
})

export const RemoveSubredditSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, 'Subreddit name is required'),
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

export const MarkThreadsCompleteSchema = z.object({
  projectId: z.string(),
  channel: z.enum(['reddit', 'twitter', 'linkedin']),
  threadIds: z.array(z.string()).min(1),
})

export const GenerateThreadReplySchema = z.object({
  threadId: z.string(),
})

export const SaveNotificationPrefSchema = z.object({
  notifyNewLeads: z.boolean(),
})

export const SaveMentionsInterestSchema = z.object({
  feature: z.string().min(1),
  interested: z.boolean(),
})

export const SaveAlertPrefSchema = z.object({
  notifyInbounds: z.boolean(),
  notifyOutbound: z.boolean(),
  channels: z.array(z.string()),
})
