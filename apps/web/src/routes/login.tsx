import { createFileRoute, redirect } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react'
import { Input } from '#/components/Input'
import { RiMailSendLine, RiArrowLeftLine } from 'react-icons/ri'
import { authClient } from '#/lib/auth-client'
import { getSession } from '#/lib/session'

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long'),
  email: z.string().email('Enter a valid email address'),
})

type LoginForm = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

// ---------------------------------------------------------------------------
// Google brand logo (four-color SVG - no react-icons equivalent)
// ---------------------------------------------------------------------------
function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.05 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.18l7.08 5.5C12.4 13.68 17.73 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.93-2.2 5.41-4.67 7.07l7.19 5.59C43.18 37.37 46.5 31.36 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.72 28.32A14.6 14.6 0 0 1 9.5 24c0-1.5.26-2.95.72-4.32l-7.08-5.5A23.94 23.94 0 0 0 0 24c0 3.87.93 7.52 2.56 10.74l8.16-6.42z" />
      <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.49-4.94l-7.19-5.59C28.5 37.85 26.35 38.5 24 38.5c-6.27 0-11.6-4.18-13.28-9.68l-8.16 6.42C6.07 42.55 14.45 47 24 47z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const callbackURL = redirectTo ?? '/dashboard'
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // ── Magic link submit ──────────────────────────────────────────────────────
  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    const { error } = await authClient.signIn.magicLink({
      email: data.email,
      name: data.name,
      callbackURL,
    })
    if (error) {
      setServerError(error.message ?? 'Something went wrong. Please try again.')
      return
    }
    setSentTo(data.email)
    setSent(true)
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true)
    await authClient.signIn.social({ provider: 'google', callbackURL })
    setGoogleLoading(false)
  }

  // ── Sent confirmation ─────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50 px-4">
        <Card className="w-full max-w-md card-surface">
          <CardBody className="items-center gap-3 px-8 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
              <RiMailSendLine className="text-2xl text-success-600" />
            </div>
            <h2 className="text-xl font-semibold">Check your inbox</h2>
            <p className="text-sm text-default-500">
              We sent a magic link to{' '}
              <span className="font-medium text-default-800">{sentTo}</span>.
              Click the link to sign in - it expires in 10 minutes.
            </p>
            <Button
              variant="light"
              size="sm"
              startContent={<RiArrowLeftLine />}
              onPress={() => setSent(false)}
              className="mt-2"
            >
              Use a different email
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-default-50 px-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="card-surface">
          <CardHeader className="flex-col items-center gap-1 px-8 pt-8 pb-0">
            <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-default-500">
              Enter your details and we'll email you a magic link.
            </p>
          </CardHeader>

          <CardBody className="gap-4 px-8 pb-8 pt-6">
            {/* Google */}
            <Button
              variant="bordered"
              fullWidth
              startContent={<GoogleLogo />}
              isLoading={googleLoading}
              isDisabled={isSubmitting}
              onPress={handleGoogle}
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Divider className="flex-1" />
              <span className="text-xs text-default-400">or sign in with email</span>
              <Divider className="flex-1" />
            </div>

            {/* Magic link form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-4"
            >
              <Input
                label="Name"
                placeholder="Jane Doe"
                autoComplete="name"
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                autoFocus
                {...register('name')}
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                {...register('email')}
              />

              {serverError && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                color="primary"
                fullWidth
                isLoading={isSubmitting}
                isDisabled={googleLoading}
                startContent={!isSubmitting && <RiMailSendLine className="text-base" />}
              >
                {isSubmitting ? 'Sending link…' : 'Send magic link'}
              </Button>
            </form>
          </CardBody>
        </Card>


      </div>
    </div>
  )
}
