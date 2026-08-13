import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { QueryClientProvider } from '@tanstack/react-query'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'OpenCMO - show up in AI answers',
      },
      {
        name: 'description',
        content:
          'AI assistants like ChatGPT and Perplexity learn from Reddit. OpenCMO finds the threads worth joining and drafts replies that sound like you - so your product becomes the answer. Open source, your own AI keys, $5 a month.',
      },
      {
        name: 'og:title',
        content: 'OpenCMO - show up in AI answers',
      },
      {
        name: 'og:description',
        content:
          'AI assistants like ChatGPT and Perplexity learn from Reddit. OpenCMO finds the threads worth joining and drafts replies that sound like you - so your product becomes the answer.',
      },
      {
        name: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary',
      },
      {
        name: 'twitter:title',
        content: 'OpenCMO - show up in AI answers',
      },
      {
        name: 'twitter:description',
        content:
          'AI assistants like ChatGPT and Perplexity learn from Reddit. OpenCMO finds the threads worth joining and drafts replies that sound like you - so your product becomes the answer.',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Geist:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
