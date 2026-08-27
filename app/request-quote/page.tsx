import { redirect } from 'next/navigation'

export default function RequestQuotePage() {
  redirect('/contact?interest=quote_request')
}
