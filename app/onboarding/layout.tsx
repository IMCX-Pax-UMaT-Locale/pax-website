import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Member onboarding',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
