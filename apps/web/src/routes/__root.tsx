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

const siteUrl = import.meta.env.VITE_BETTER_AUTH_URL || 'http://localhost:3000'
const ogImageUrl = `${siteUrl}/og.png`

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
        property: 'og:title',
        content: 'OpenCMO - show up in AI answers',
      },
      {
        property: 'og:description',
        content:
          'AI assistants like ChatGPT and Perplexity learn from Reddit. OpenCMO finds the threads worth joining and drafts replies that sound like you - so your product becomes the answer.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:image',
        content: ogImageUrl,
      },
      {
        property: 'og:image:width',
        content: '1265',
      },
      {
        property: 'og:image:height',
        content: '714',
      },
      {
        property: 'og:image:type',
        content: 'image/png',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:image',
        content: ogImageUrl,
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
        <script
          src="https://cdn.databuddy.cc/databuddy.js"
          data-client-id="0890c01d-effa-40fe-9c76-a30517912ed3"
          data-track-web-vitals="true"
          crossOrigin="anonymous"
          async
        ></script>
        <script src="https://www.quickfeed.live/widget.js" data-website-id="4b235b6e-2d61-4b59-bf15-b8f021f9dab0" defer></script>
        <script
          defer
          data-website-id="6a7e2d530020ea2ea8e6"
          data-domain="opencmo.site"
          src="https://www.insightly.live/script.js">
        </script>
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
