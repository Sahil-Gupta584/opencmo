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
  if (!user.notifyNewLeads) {
    console.log(`🔵 [Notify] User ${user.id} disabled lead notifications - skipping email`)
    return
  }
  if (!env.RESEND_API_KEY) {
    console.log(`🔵 [Notify] RESEND_API_KEY not set - skipping email for ${projectName}`)
    return
  }

  const topPriority = newLeads.reduce((acc, lead) => {
    const rank = { high: 0, medium: 1, low: 2 }[lead.priority as 'high' | 'medium' | 'low'] ?? 1
    const accRank = { high: 0, medium: 1, low: 2 }[acc.priority as 'high' | 'medium' | 'low'] ?? 1
    return rank < accRank ? lead : acc
  }, newLeads[0])

  const rows = newLeads
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

  const html = `
    <div style="background:#FAFAFA;padding:24px;font-family:Inter, -apple-system, sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #E2E8F0;">
          <h1 style="margin:0;font-size:18px;color:#0F172A;font-weight:700;">${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} for ${projectName}</h1>
          <p style="margin:6px 0 0;color:#64748B;font-size:13px;">Top pick: ${topPriority.title} - open OpenCMO to review and reply.</p>
        </div>
        <div style="padding:8px 28px 24px;">
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
        </div>
        <div style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;color:#64748B;font-size:12px;">
          Reply fast - Reddit threads decay quickly. You're receiving this because new buying-intent leads were found for ${projectName}.
        </div>
      </div>
    </div>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} for ${projectName}`,
      html,
    })
    if (error) {
      console.error(`🔴 [Notify] Resend error for user ${user.id}:`, error)
    } else {
      console.log(`🟢 [Notify] Sent ${newLeads.length}-lead email to ${user.email} for ${projectName}`)
    }
  } catch (err) {
    console.error(`🔴 [Notify] Failed to send email for user ${user.id}:`, err)
  }
}