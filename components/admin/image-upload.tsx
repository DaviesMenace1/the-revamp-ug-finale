'use client'

import { X, Upload } from 'lucide-react'
import Image from 'next/image'
import { CldUploadWidget } from 'next-cloudinary'

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  maxImages?: number
  label?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  label = 'Upload Image',
}: ImageUploadProps) {
  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((url, idx) => (
          <div key={idx} className="relative h-32 rounded-lg overflow-hidden border border-border/20 group">
            <Image src={url} alt="Uploaded asset" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'revamp_preset'}
            onSuccess={(result: any) => {
              if (result?.info?.secure_url) {
                onChange([...value, result.info.secure_url].slice(0, maxImages))
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="border-2 border-dashed border-border/40 hover:border-primary/50 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer bg-muted/5 transition-colors w-full"
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground font-light text-center px-2">{label}</span>
              </button>
            )}
          </CldUploadWidget>
        )}
      </div>
    </div>
  )
}


