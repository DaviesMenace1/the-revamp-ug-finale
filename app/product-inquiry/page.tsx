import { redirect } from 'next/navigation'

export default function ProductInquiryPage() {
  redirect('/contact?interest=product_inquiry')
}
