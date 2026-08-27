import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search | The Revamp UG',
  robots: { index: false, follow: true },
}

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
