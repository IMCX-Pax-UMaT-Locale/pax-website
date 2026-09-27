import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IMCS-PAX Romana UMaT Local | Liberation for Peace',
  description: 'A Catholic movement for students and young professionals growing in faith, friendship, and service.',
  generator: 'Achilles Deyeni',
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
