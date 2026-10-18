import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'IMCS-PAX Romana UMaT Local',
    template: '%s | IMCS-PAX Romana UMaT Local',
  },
  description: 'A Catholic movement for students and young professionals growing in faith, friendship, and service.',
  keywords: [
    'IMCS-PAX Romana',
    'UMaT',
    'Catholic students',
    'Catholic professionals',
    'Tarkwa',
    'Christian community',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    siteName: 'IMCS-PAX Romana UMaT Local',
    title: 'IMCS-PAX Romana UMaT Local',
    description: 'A Catholic movement for students and young professionals growing in faith, friendship, and service.',
    images: [
      {
        url: '/pax-logo.png',
        alt: 'IMCS-PAX Romana logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'IMCS-PAX Romana UMaT Local',
    description: 'A Catholic movement for students and young professionals growing in faith, friendship, and service.',
    images: ['/pax-logo.png'],
  },
  icons: {
    icon: [
      {
        url: '/pax-logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/pax-logo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/pax-logo.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
