import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join the movement',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
