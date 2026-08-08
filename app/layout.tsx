import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant_Garamond, Instrument_Sans } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-provider'
import { CartProvider } from '@/lib/context/cart-context'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateOrganizationSchema, generateLocalBusinessSchema } from '@/lib/seo/schema-generator'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
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
    url: 'https://therevampug.com',
    images: [
      {
        url: 'https://therevampug.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Revamp UG - Luxury Design House',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Revamp UG | Luxury Design House',
    description: 'Interior design, architecture, procurement, and custom furniture services.',
    creator: '@therevampug',
    images: ['https://therevampug.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://therevampug.com',
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
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${instrument.variable} bg-background`}>
        <head>
          {/* Theme Script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const theme = localStorage.getItem('revamp-theme-preference') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
          
          {/* JSON-LD Schema Markup for SEO */}
          <SchemaScript schema={generateOrganizationSchema()} />
          <SchemaScript schema={generateLocalBusinessSchema()} />
          
          {/* Sitemap */}
          <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
          
          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        </head>
        <body className="antialiased">
          <CartProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </CartProvider>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
