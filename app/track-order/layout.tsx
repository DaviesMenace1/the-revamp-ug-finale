import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Order | The Revamp UG',
  robots: { index: false, follow: true },
}

export default function TrackOrderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
