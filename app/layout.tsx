import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant_Garamond, Instrument_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/lib/theme-provider'
import { NewsletterPopup } from '@/components/newsletter-popup'
import { CookieConsentProvider } from '@/components/privacy/cookie-consent-provider'
import OneSignalBootstrap from '@/components/notifications/onesignal-bootstrap'
import ConsentGatedAnalytics from '@/components/analytics/consent-gated-analytics'
import { CartProvider } from '@/lib/context/cart-context'
import { FloatingUtilities } from '@/components/floating-utilities'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateOrganizationSchema, generateLocalBusinessSchema, generateWebSiteSchema } from '@/lib/seo/schema-generator'
import WebMcpBootstrap from '@/components/agent/webmcp-bootstrap'
import ClerkRuntimeGuard from '@/components/auth/clerk-runtime-guard'
import GoogleOneTapPrompt from '@/components/auth/google-one-tap-prompt'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  variable: '--font-serif',
  display: 'swap',
})

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'The Revamp UG | Luxury Interior Design & Architecture',
    template: '%s | The Revamp UG',
  },
  description: 'Bespoke interior design, architecture, global sourcing, and white-glove installation. Transforming spaces into extraordinary living experiences across East Africa and beyond.',
  keywords: ['interior design', 'architecture', 'luxury furniture', 'global sourcing', 'procurement', 'Uganda', 'East Africa', 'design services', 'custom furniture'],
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    siteName: 'The Revamp UG',
    title: 'The Revamp UG | Luxury Interior Design & Architecture',
    description: 'Bespoke interior design, architecture, global sourcing, and white-glove installation. Transforming spaces into extraordinary living experiences.',
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/brand/revamp-logo.png`,
        width: 900,
        height: 600,
        alt: 'The Revamp UG - Luxury Design House',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Revamp UG | Luxury Design House',
    description: 'Interior design, architecture, procurement, and custom furniture services.',
    images: [`${SITE_URL}/brand/revamp-logo.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [{ url: '/icon-light-32x32.png' }, { url: '/favicon.ico', sizes: 'any' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

// app/layout.tsx

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
const hasValidClerkPublishableKey = /^pk_(test|live)_[A-Za-z0-9_]+$/.test(publishableKey ?? '')

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
  <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${instrument.variable} bg-background`}>
      <head>
        {/* Theme Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('revamp-theme-preference') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            `,
          }}
        />
        
        <SchemaScript schema={generateOrganizationSchema()} />
        <SchemaScript schema={generateLocalBusinessSchema()} />
        <SchemaScript schema={generateWebSiteSchema()} />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      
      <body className="antialiased">
        <ClerkProvider
          publishableKey={publishableKey || ''}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <ClerkRuntimeGuard configured={hasValidClerkPublishableKey}>
            <CookieConsentProvider>
              <CartProvider>
                <ThemeProvider>
                  {children}
                  <FloatingUtilities />
                </ThemeProvider>
                <NewsletterPopup />
                <OneSignalBootstrap />
                <ConsentGatedAnalytics />
                <WebMcpBootstrap />
              </CartProvider>
            </CookieConsentProvider>
          </ClerkRuntimeGuard>
          {hasValidClerkPublishableKey && <GoogleOneTapPrompt />}
        </ClerkProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
