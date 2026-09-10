'use client'

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
}

export function LuxuryMenuIcon(props: IconProps) { return <Base {...props}><line x1="1" y1="3.625" x2="23" y2="3.625" /><line x1="1" y1="11.625" x2="23" y2="11.625" /><line x1="1" y1="19.625" x2="23" y2="19.625" /></Base> }
export function LuxurySearchIcon(props: IconProps) { return <Base {...props}><circle cx="10.75" cy="10.25" r="6.9" /><line x1="15.9" y1="15.4" x2="21.8" y2="21.2" /></Base> }
export function LuxuryAccountIcon(props: IconProps) { return <Base {...props}><path d="M5.4 20v-5.2c0-1.25 1.02-2.27 2.27-2.27h4.66c1.25 0 2.27 1.02 2.27 2.27V20" /><circle cx="10" cy="6.75" r="3.25" /></Base> }
export function LuxuryBagIcon(props: IconProps) { return <Base {...props}><path d="M4.5 7.75h15v9.55c0 1.5-1.2 2.7-2.7 2.7H7.2c-1.5 0-2.7-1.2-2.7-2.7V7.75Z" /><path d="M8.25 7.75a3.4 3.4 0 0 1 6.8 0" /></Base> }
export function LuxuryCloseIcon(props: IconProps) { return <Base {...props}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></Base> }
export function LuxuryHomeIcon(props: IconProps) { return <Base {...props}><path d="m3.5 10.5 8.5-7 8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M9.5 20v-5h5v5" /></Base> }
export function LuxuryBellIcon(props: IconProps) { return <Base {...props}><path d="M5.5 16.5h9.8l-1.1-1.7V10a3.8 3.8 0 0 0-7.6 0v4.8l-1.1 1.7Z" /><path d="M9 19h2.8" /></Base> }
export function LuxuryHeartIcon(props: IconProps) { return <Base {...props}><path d="M12 20s-7.4-4.5-8.8-8.6C2.2 8.2 4.1 5 7.3 5c1.9 0 3.5 1.1 4.7 2.7C13.2 6.1 14.8 5 16.7 5c3.2 0 5.1 3.2 4.1 6.4C19.4 15.5 12 20 12 20Z" /></Base> }
export function LuxuryArrowIcon(props: IconProps) { return <Base {...props}><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13,6 19,12 13,18" /></Base> }
