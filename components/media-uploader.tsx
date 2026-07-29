'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { MEDIA_TYPES } from '@/lib/media/config';

interface MediaUploaderProps {
  type: 'public' | 'sensitive';
  mediaType?: keyof typeof MEDIA_TYPES.PUBLIC;
  documentType?: keyof typeof MEDIA_TYPES.SENSITIVE;
  onUploadComplete?: (result: any) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}

export function MediaUploader({
  type,
  mediaType,
  documentType,
  onUploadComplete,
  onError,
  maxFiles = 1,
  className = '',
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length && i < maxFiles; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        if (type === 'public' && mediaType) {
          formData.append('mediaType', mediaType);
        } else if (type === 'sensitive' && documentType) {
          formData.append('documentType', documentType);
        }

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await response.json();
        setUploadedFiles((prev) => [...prev, data]);
        setUploadProgress(((i + 1) / files.length) * 100);

        if (onUploadComplete) {
          onUploadComplete(data);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setUploading(false);
      event.currentTarget.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
        <label className="cursor-pointer block">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Click to upload or drag and drop'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {type === 'public' ? 'Images, videos up to 100MB' : 'Documents up to 20MB'}
          </p>
          <input
            type="file"
            multiple={maxFiles > 1}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            accept={type === 'public' ? 'image/*,video/*' : '.pdf,.doc,.docx,.txt'}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  {file.type === 'cloudinary' ? 'Cloudinary' : 'AWS S3'}: {file.url || file.key}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
