import { os } from '@orpc/server'
import { ORPCError } from '@orpc/client'
import { auth } from '../auth.js'
import { prisma } from '@repo/database'

export interface ORPCContext {
  headers: Headers | Record<string, string>
  req?: Request
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
// Authed base builder - use for protected procedures
export const authed = base.use(async ({ context, next }) => {
	let headers: Headers

	// Convert headers properly
	if (context.headers instanceof Headers) {
		headers = context.headers
	} else {
		// Node.js style headers - lowercase keys
		headers = new Headers()
		for (const [key, value] of Object.entries(context.headers)) {
			if (Array.isArray(value)) {
				value.forEach(v => headers.append(key, v))
			} else if (value !== undefined) {
				headers.set(key, String(value))
			}
		}
	}

	try {
		const session = await auth.api.getSession({ headers })

		if (!session?.user) {
			console.log("getSession returned null/empty")
			throw new ORPCError('UNAUTHORIZED')
		}

		return next({
			context: {
				...context,
				session: session.session,
				user: session.user,
			},
		})
	} catch (error) {
		console.error("getSession threw error:", error)
		throw error
	}
})
