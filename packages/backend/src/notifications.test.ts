import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isValidDiscordWebhookUrl,
  formatDiscordEmbed,
  sendDiscordTestPing,
  sendNewLeadsDiscordAlert,
} from './notifications.js'
import type { NewLead } from './inbounds-service.js'

describe('Discord alerts', () => {
  describe('isValidDiscordWebhookUrl', () => {
    it('accepts valid Discord webhook URLs', () => {
      expect(
        isValidDiscordWebhookUrl(
          'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz',
        ),
      ).toBe(true)
      expect(
        isValidDiscordWebhookUrl(
          'https://discordapp.com/api/webhooks/1234567890/token-value',
        ),
      ).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(isValidDiscordWebhookUrl('')).toBe(false)
      expect(isValidDiscordWebhookUrl('https://malicious.site/webhook')).toBe(false)
      expect(isValidDiscordWebhookUrl('not-a-url')).toBe(false)
      expect(isValidDiscordWebhookUrl('http://discord.com/api/webhooks/123/abc')).toBe(false)
    })
  })

  describe('formatDiscordEmbed', () => {
    it('creates rich embed for new leads', () => {
      const leads: NewLead[] = [
        {
          id: 'lead-1',
          title: 'Looking for a social marketing tool',
          url: 'https://reddit.com/r/marketing/123',
          subreddit: 'r/marketing',
          priority: 'high',
          intentReason: 'User asks for tool alternatives',
          channel: 'reddit',
        },
      ]

      const payload = formatDiscordEmbed('MyProject', leads)
      expect(payload.embeds).toBeDefined()
      expect(payload.embeds.length).toBe(1)
      expect(payload.embeds[0].title).toContain('1 new lead')
      expect(payload.embeds[0].title).toContain('MyProject')
      expect(payload.embeds[0].fields?.length).toBe(1)
      expect(payload.embeds[0].fields?.[0].name).toContain('HIGH')
      expect(payload.embeds[0].fields?.[0].value).toContain('https://reddit.com/r/marketing/123')
    })
  })

  describe('sendDiscordTestPing', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('rejects invalid webhook URLs gracefully without throwing', async () => {
      const result = await sendDiscordTestPing('invalid-url')
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/valid discord webhook url/i)
    })

    it('returns success when Discord responds with 200/204', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 204 }),
      )

      const result = await sendDiscordTestPing(
        'https://discord.com/api/webhooks/1234567890/token-ok',
      )

      expect(fetchSpy).toHaveBeenCalledOnce()
      expect(result.success).toBe(true)
    })

    it('handles non-200 responses gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ message: 'Invalid Webhook Token' }), {
          status: 401,
          statusText: 'Unauthorized',
        }),
      )

      const result = await sendDiscordTestPing(
        'https://discord.com/api/webhooks/1234567890/token-bad',
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('401')
    })
  })

  describe('sendNewLeadsDiscordAlert', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('delivers rich embed to Discord webhook when enabled', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 204 }),
      )

      const leads: NewLead[] = [
        {
          id: 'lead-1',
          title: 'Need marketing automation',
          url: 'https://reddit.com/r/saas/abc',
          subreddit: 'r/saas',
          priority: 'high',
          intentReason: 'Wants product',
          channel: 'reddit',
        },
      ]

      await sendNewLeadsDiscordAlert(
        'https://discord.com/api/webhooks/123/token',
        'AcmeApp',
        leads,
      )

      expect(fetchSpy).toHaveBeenCalledOnce()
      const call = fetchSpy.mock.calls[0]
      expect(call[0]).toBe('https://discord.com/api/webhooks/123/token')
      const body = JSON.parse(call[1]?.body as string)
      expect(body.embeds).toBeDefined()
    })

    it('does not throw on network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'))

      await expect(
        sendNewLeadsDiscordAlert(
          'https://discord.com/api/webhooks/123/token',
          'AcmeApp',
          [
            {
              id: 'lead-1',
              title: 'Need marketing automation',
              url: 'https://reddit.com/r/saas/abc',
              subreddit: 'r/saas',
              priority: 'high',
              intentReason: 'Wants product',
              channel: 'reddit',
            },
          ],
        ),
      ).resolves.not.toThrow()
    })
  })
})
