import { Resend } from 'resend'
import { env } from './env.js'
import type { NewLead } from './inbounds-service.js'

export interface NotificationUser {
  id: string
  email: string
  name: string
  notifyNewLeads: boolean
}

const FROM_EMAIL = 'OpenCMO <noreply@chatcash.live>'

/**
 * Sends one batched email per project listing all new valid leads found in a fetch
 * cycle. No-op when there are no new leads, the user disabled notifications, or
 * RESEND_API_KEY is not configured.
 */
export async function sendNewLeadsEmail(
  user: NotificationUser,
  projectName: string,
  newLeads: NewLead[],
): Promise<void> {
  if (newLeads.length === 0) return

  // Lead emails only carry Reddit leads - other channels stay out of the inbox digest
  const redditLeads = newLeads.filter((lead) => lead.channel === 'reddit')
  if (redditLeads.length === 0) {
    console.log(`🔵 [Notify] No Reddit leads for ${projectName} - skipping email`)
    return
  }

  if (!user.notifyNewLeads) {
    console.log(`🔵 [Notify] User ${user.id} disabled lead notifications - skipping email`)
    return
  }
  if (!env.RESEND_API_KEY) {
    console.log(`🔵 [Notify] RESEND_API_KEY not set - skipping email for ${projectName}`)
    return
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const
  const topLeads = [...redditLeads]
    .sort((a, b) => (priorityRank[a.priority as keyof typeof priorityRank] ?? 1) - (priorityRank[b.priority as keyof typeof priorityRank] ?? 1))
    .slice(0, 2)

  const topPriority = topLeads[0]

  const rows = topLeads
    .map(
      (lead) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <a href="${lead.url}" style="color:#4F46E5;font-weight:600;text-decoration:none;font-size:14px;">${lead.title}</a>
          <div style="color:#64748B;font-size:12px;margin-top:4px;">${lead.subreddit} · ${lead.priority.toUpperCase()} priority</div>
          ${lead.intentReason ? `<div style="color:#0F172A;font-size:13px;margin-top:6px;">${lead.intentReason}</div>` : ''}
        </td>
      </tr>`,
    )
    .join('')

  const inboundUrl = `${env.BETTER_AUTH_URL}/dashboard/inbounds`

  const html = `
    <div style="background:#FAFAFA;padding:24px;font-family:Inter, -apple-system, sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #E2E8F0;">
          <h1 style="margin:0;font-size:18px;color:#0F172A;font-weight:700;">${redditLeads.length} new Reddit lead${redditLeads.length > 1 ? 's' : ''} for ${projectName}</h1>
          <p style="margin:6px 0 0;color:#64748B;font-size:13px;">${redditLeads.length} leads waiting for you in OpenCMO - here are the top ${topLeads.length}:</p>
        </div>
        <div style="padding:8px 28px 24px;">
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
        </div>
        <div style="padding:16px 28px;">
          <a href="${inboundUrl}" style="display:inline-block;background:#4F46E5;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">Open Inbound Page</a>
        </div>
        <div style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;color:#64748B;font-size:12px;">
          Reply fast - Reddit threads decay quickly. You're receiving this because new buying-intent leads were found for ${projectName}.
        </div>
      </div>
    </div>`

  try {
    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${redditLeads.length} new Reddit lead${redditLeads.length > 1 ? 's' : ''} for ${projectName}`,
      html,
    })
    if (error) {
      console.error(`🔴 [Notify] Resend error for user ${user.id}:`, error)
    } else {
      console.log(`🟢 [Notify] Sent top ${topLeads.length}/${redditLeads.length}-lead email to ${user.email} for ${projectName}`)
    }
  } catch (err) {
    console.error(`🔴 [Notify] Failed to send email for user ${user.id}:`, err)
  }
}
export const DISCORD_WEBHOOK_REGEX =
  /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/

export function isValidDiscordWebhookUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  return DISCORD_WEBHOOK_REGEX.test(url.trim())
}

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbed {
  title: string
  description?: string
  url?: string
  color?: number
  fields?: DiscordEmbedField[]
  footer?: { text: string }
  timestamp?: string
}

export interface DiscordWebhookPayload {
  content?: string
  embeds?: DiscordEmbed[]
}

export function formatDiscordEmbed(
  projectName: string,
  newLeads: NewLead[],
): DiscordWebhookPayload {
  const count = newLeads.length
  const inboundUrl = env.BETTER_AUTH_URL
    ? `${env.BETTER_AUTH_URL}/dashboard/inbounds`
    : undefined

  const priorityRank = { high: 0, medium: 1, low: 2 } as const
  const sortedLeads = [...newLeads]
    .sort(
      (a, b) =>
        (priorityRank[a.priority as keyof typeof priorityRank] ?? 1) -
        (priorityRank[b.priority as keyof typeof priorityRank] ?? 1),
    )
    .slice(0, 5)

  const fields: DiscordEmbedField[] = sortedLeads.map((lead) => {
    const channelTag = lead.channel ? `[${lead.channel.toUpperCase()}]` : ''
    const sub = lead.subreddit ? `${lead.subreddit} · ` : ''
    const intent = lead.intentReason ? `\n> ${lead.intentReason}` : ''
    return {
      name: `${channelTag} ${lead.priority.toUpperCase()}: ${lead.title}`.slice(0, 256),
      value: `${sub}[View Thread](${lead.url})${intent}`.slice(0, 1024),
    }
  })

  return {
    embeds: [
      {
        title: `🎯 ${count} new lead${count > 1 ? 's' : ''} found for ${projectName}`,
        description: `New buying-intent discussions match your product keywords. Reply quickly while the conversation is active.`,
        url: inboundUrl,
        color: 0x5865f2, // Discord Blurple
        fields,
        footer: { text: 'OpenCMO Lead Alerts' },
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

export async function sendDiscordTestPing(
  webhookUrl: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return {
      success: false,
      error: 'Please enter a valid Discord webhook URL (e.g. https://discord.com/api/webhooks/...)',
    }
  }

  try {
    const payload: DiscordWebhookPayload = {
      embeds: [
        {
          title: '🔔 OpenCMO Discord Alert Verification',
          description:
            'Your Discord webhook is configured successfully! New buying-intent leads will be posted here.',
          color: 0x57f287, // Green
          footer: { text: 'OpenCMO Notifications' },
          timestamp: new Date().toISOString(),
        },
      ],
    }

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return {
        success: false,
        error: `Discord webhook rejected the ping (HTTP ${response.status}: ${response.statusText}${text ? ` - ${text}` : ''})`,
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('🔴 [Discord] Failed to send test ping:', err)
    return {
      success: false,
      error: err?.message || 'Failed to connect to Discord webhook URL',
    }
  }
}

export async function sendNewLeadsDiscordAlert(
  webhookUrl: string,
  projectName: string,
  newLeads: NewLead[],
): Promise<void> {
  if (!newLeads || newLeads.length === 0) return
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    console.warn('⚠️ [Discord] Skipping alert: invalid webhook URL')
    return
  }

  try {
    const payload = formatDiscordEmbed(projectName, newLeads)
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error(
        `🔴 [Discord] Webhook error (${response.status} ${response.statusText}): ${text}`,
      )
    } else {
      console.log(
        `🟢 [Discord] Sent alert for ${newLeads.length} lead(s) on ${projectName}`,
      )
    }
  } catch (err) {
    console.error('🔴 [Discord] Failed to send new leads alert:', err)
  }
}
