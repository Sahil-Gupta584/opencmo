import { createRouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createIsomorphicFn } from '@tanstack/react-start'

import type { RouterClient } from '@orpc/server'

import router from '@repo/backend/router'

const apiBaseUrl =  process.env.VITE_API_URL || import.meta.env.VITE_API_URL
console.log({ c: import.meta.env.VITE_API_URL, d: process.env.VITE_API_URL});

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: () => ({
        headers: getRequestHeaders(),
      }),
    }),
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: `${apiBaseUrl}/api/rpc`,
      fetch: (request, init) =>
        fetch(request, {
          ...init,
          credentials: 'include',
        }),
    })
    return createORPCClient(link)
  })

export const client: RouterClient<typeof router> = getORPCClient()

export const orpc = createTanstackQueryUtils(client)