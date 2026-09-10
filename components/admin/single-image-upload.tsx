'use client'
import { ImageUpload } from '@/components/admin/image-upload'

export function SingleImageUpload({ value, onChange, label = 'Upload image' }: { value?: string; onChange: (value: string) => void; label?: string }) {
  return <ImageUpload value={value ? [value] : []} onChange={(values) => onChange(values[0] || '')} maxImages={1} label={label} />
}
