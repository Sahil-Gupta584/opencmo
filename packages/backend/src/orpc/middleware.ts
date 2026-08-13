import { os } from '@orpc/server'
import { ORPCError } from '@orpc/client'
import { auth } from '../auth.js'

export interface ORPCContext {
  headers: Headers | Record<string, string>
}

export const errorLogger = os.middleware(async ({ context, next, path }) => {
  try {
    return await next({ context })
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('🔴 ORPC Error')
    console.error('Path:', path.join('.'))
    console.error('User:', (context as any).user?.id ?? 'anonymous')

    if (error instanceof Error) {
      console.error('Error Message:', error.message)
      console.error('Stack Trace:', error.stack)
    } else {
      console.error('Error:', error)
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (error instanceof ORPCError) {
      throw error
    }

    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: error instanceof Error ? error.message : 'Internal server error',
    })
  }
})

// Base with error logging - export for public procedures
export const base = os.$context<ORPCContext>().use(errorLogger)

// Authed base builder - use for protected procedures
export const authed = base.use(async ({ context, next }) => {
  const headers =
    context.headers instanceof Headers
      ? context.headers
      : new Headers(context.headers as Record<string, string>)

  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({
    context: {
      ...context,
      session: session.session,
      user: session.user,
    },
  })
})
