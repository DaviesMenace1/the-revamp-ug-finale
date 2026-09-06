'use client'

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Check, Image as ImageIcon, Loader2, Upload, X } from '@/components/ui/luxury-icons'

type UploadResult = {
  info: {
    secure_url: string
    public_id: string
    asset_id: string
    original_filename?: string
    resource_type?: string
  }
}

type CloudflareUploadWidgetProps = {
  options?: {
    multiple?: boolean
    maxFiles?: number
    resourceType?: 'image'
  }
  uploadPreset?: string
  onSuccess?: (result: UploadResult) => void
  onError?: (error: Error) => void
  children: (args: { open: () => void }) => ReactNode
}

type SelectedFile = {
  file: File
  preview: string
}

export function CldUploadWidget({
  options,
  onSuccess,
  onError,
  children,
}: CloudflareUploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [openState, setOpenState] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const maxFiles = Math.max(1, options?.maxFiles ?? (options?.multiple ? 20 : 1))
  const multiple = Boolean(options?.multiple) && maxFiles > 1

  useEffect(() => {
    if (!openState) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !uploading) setOpenState(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openState, uploading])

  function open() {
    setError('')
    setOpenState(true)
  }

  function close() {
    if (uploading) return
    files.forEach((item) => URL.revokeObjectURL(item.preview))
    setFiles([])
    setProgress(0)
    setOpenState(false)
  }

  function addFiles(inputFiles: FileList | File[]) {
    const incoming = Array.from(inputFiles)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, multiple ? maxFiles : 1)

    if (incoming.length === 0) {
      setError('Choose an image or video file to continue.')
      return
    }

    files.forEach((item) => URL.revokeObjectURL(item.preview))
    setError('')
    setFiles(incoming.map((file) => ({ file, preview: URL.createObjectURL(file) })))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (!uploading) addFiles(event.dataTransfer.files)
  }

  async function uploadFiles() {
    if (files.length === 0 || uploading) return
    setUploading(true)
    setError('')
    setProgress(0)

    try {
      for (let index = 0; index < files.length; index += 1) {
        const selected = files[index]
        const directResponse = await fetch('/api/admin/uploads/cloudflare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: selected.file.name,
            contentType: selected.file.type,
            fileSize: selected.file.size,
            resourceType: 'image',
          }),
        })
        const directData = await directResponse.json().catch(() => null)
        if (!directResponse.ok || !directData?.uploadURL || !directData?.imageId) {
          throw new Error(directData?.error || 'Could not prepare the Cloudflare upload.')
        }

        const formData = new FormData()
        formData.append('file', selected.file)
        const uploadResponse = await fetch(directData.uploadURL, {
          method: 'POST',
          body: formData,
        })
        if (!uploadResponse.ok) {
          throw new Error(`Cloudflare could not upload ${selected.file.name}.`)
        }

        onSuccess?.({
          info: {
            secure_url: directData.deliveryURL,
            public_id: directData.imageId,
            asset_id: directData.imageId,
            original_filename: selected.file.name,
            resource_type: 'image',
          },
        })
        setProgress(Math.round(((index + 1) / files.length) * 100))
      }

      files.forEach((item) => URL.revokeObjectURL(item.preview))
      setFiles([])
      setOpenState(false)
    } catch (uploadError) {
      const normalized = uploadError instanceof Error ? uploadError : new Error('Upload failed.')
      setError(normalized.message)
      onError?.(normalized)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {children({ open })}
      {openState && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-background text-foreground shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cloudflare-upload-title">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Cloudflare Images</p>
                <h2 id="cloudflare-upload-title" className="mt-1 font-serif text-2xl">Add your media</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upload new media without changing any existing images.</p>
              </div>
              <button type="button" onClick={close} disabled={uploading} className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-50" aria-label="Close upload dialog"><X className="size-4" /></button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div
                className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'}`}
                onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input ref={inputRef} type="file" accept="image/*,video/*" multiple={multiple} className="hidden" onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = '' }} />
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-primary"><Upload className="size-5" /></div>
                <p className="mt-4 text-sm font-medium">Drag and drop your media here</p>
                <p className="mt-1 text-xs text-muted-foreground">Images are uploaded securely to Cloudflare.</p>
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-foreground px-4 text-xs uppercase tracking-[0.14em] hover:bg-foreground hover:text-background disabled:opacity-50"><ImageIcon className="size-4" /> Browse files</button>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-[0.16em]">Ready to upload</p><span className="text-xs text-muted-foreground">{files.length} file{files.length === 1 ? '' : 's'}</span></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {files.map((item) => (
                      <div key={`${item.file.name}-${item.file.lastModified}`} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                        <img src={item.preview} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1 text-[10px] text-white">{item.file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
              {uploading && <div className="space-y-2"><div className="flex items-center justify-between text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Uploading securely</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>}

              <div className="flex flex-col-reverse justify-end gap-2 border-t border-border/70 pt-4 sm:flex-row"><button type="button" onClick={close} disabled={uploading} className="min-h-11 rounded-lg border border-border px-5 text-xs uppercase tracking-[0.14em] hover:bg-muted disabled:opacity-50">Cancel</button><button type="button" onClick={uploadFiles} disabled={files.length === 0 || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-xs uppercase tracking-[0.14em] text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {uploading ? 'Uploading...' : `Upload ${files.length || ''} file${files.length === 1 ? '' : 's'}`}</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
