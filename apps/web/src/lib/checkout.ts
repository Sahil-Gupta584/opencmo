import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createRouterClient } from '@orpc/server'
import router from '@repo/backend/router'

const orpcServer = createRouterClient(router, {
  context: () => ({
    headers: getRequestHeaders(),
  }),
})

export const createCheckoutFn = createServerFn({ method: 'POST' })
  .validator((input: { plan: 'INDIE' | 'PRO' }) => input)
  .handler(async ({ data }) => {
    return orpcServer.createCheckout(data)
  })
