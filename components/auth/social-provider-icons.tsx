import type { SVGProps } from 'react'

export function GoogleMark({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.89h12.66c-.55 2.92-2.19 5.39-4.67 7.05l7.26 5.63C43.5 31.95 46.5 28.39 46.5 24z" />
    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.26-5.63c-2.01 1.35-4.58 2.14-8.63 2.14-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
}

export function LinkedInMark({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}>
    <path fill="#0A66C2" d="M20 0H4a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4z" />
    <path fill="#FFF" d="M6.5 21.5h-4v-13h4v13zM4.5 6.8a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6zM21.5 21.5h-4v-6.7c0-1.6-.6-2.7-2-2.7-1.1 0-1.7.7-2 1.4-.1.3-.1.7-.1 1.1v6.9h-4v-13h4v1.8c.5-.8 1.5-2 3.6-2 2.6 0 4.6 1.7 4.6 5.4v7.8z" />
  </svg>
}
