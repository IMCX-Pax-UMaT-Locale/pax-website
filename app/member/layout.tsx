import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Member area',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
