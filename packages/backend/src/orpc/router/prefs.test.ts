import { describe, it, expect, vi, beforeEach } from 'vitest'
import { testDiscordWebhook } from './prefs.js'
import * as notifications from '../../notifications.js'
import { auth } from '../../auth.js'

describe('prefs router', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('testDiscordWebhook', () => {
    it('calls sendDiscordTestPing and returns result without throwing', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValue({
        user: { id: 'u1' },
        session: { id: 's1' },
      } as any)

      vi.spyOn(notifications, 'sendDiscordTestPing').mockResolvedValue({
        success: true,
      })

      const caller = testDiscordWebhook.callable({
        context: { headers: new Headers() } as any,
      })

      const res = await caller({
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      })

      expect(res).toEqual({ success: true })
    })

    it('returns error result when ping fails', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValue({
        user: { id: 'u1' },
        session: { id: 's1' },
      } as any)

      vi.spyOn(notifications, 'sendDiscordTestPing').mockResolvedValue({
        success: false,
        error: 'Discord webhook rejected the ping (HTTP 404)',
      })

      const caller = testDiscordWebhook.callable({
        context: { headers: new Headers() } as any,
      })

      const res = await caller({
        webhookUrl: 'https://discord.com/api/webhooks/123/bad',
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain('404')
    })
  })
})
