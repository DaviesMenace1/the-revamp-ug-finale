# Media Upload System - Complete Implementation

## Overview

Complete media upload infrastructure with automatic routing:
- **Public Media** → Cloudinary (images, videos, profiles)
- **Sensitive Documents** → AWS S3 (encrypted contracts, invoices, certificates)

---

## Files Created

### Configuration & Logic (3 files)
1. **lib/media/config.ts** (157 lines)
   - Media type definitions
   - Upload rules and limits
   - Error messages
   - Cloudinary transformations

2. **lib/media/cloudinary.ts** (147 lines)
   - Cloudinary upload handler
   - File deletion
   - URL generation with transformations
   - Error handling

3. **lib/media/aws-s3.ts** (225 lines)
   - AWS S3 upload handler
   - Encryption support
   - Signed URL generation
   - File deletion
   - S3 key generation with metadata

### API & Components (2 files)
4. **app/api/media/upload/route.ts** (85 lines)
   - Upload routing endpoint
   - Handles both Cloudinary and S3
   - Request validation

5. **components/media-uploader.tsx** (130 lines)
   - React component for file uploads
   - Drag and drop support
   - Progress tracking
   - Error handling
   - Works for both public and sensitive

### Documentation (2 files)
6. **MEDIA_UPLOAD_ENV_VARIABLES.md** (301 lines)
   - Complete environment variables guide
   - Setup instructions for both services
   - Security best practices
   - Troubleshooting guide

7. **MEDIA_UPLOAD_IMPLEMENTATION.md** (this file)

---

## Quick Start

### 1. Set Environment Variables

**From you (the user):**
```bash
# Cloudinary (get from dashboard.cloudinary.com)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (get from AWS console)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_BUCKET_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 2. Use in Components

**Public Media (Cloudinary):**
```tsx
import { MediaUploader } from '@/components/media-uploader';

<MediaUploader
  type="public"
  mediaType="productImages"
  onUploadComplete={(result) => {
    console.log('Cloudinary URL:', result.url);
  }}
/>
```

**Sensitive Documents (AWS S3):**
```tsx
<MediaUploader
  type="sensitive"
  documentType="contracts"
  onUploadComplete={(result) => {
    console.log('S3 Key:', result.key);
  }}
/>
```

### 3. Direct API Usage

```typescript
// Upload to appropriate service
const formData = new FormData();
formData.append('file', fileObject);
formData.append('mediaType', 'productImages'); // or documentType

const response = await fetch('/api/media/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

---

## Media Type Routing

### Public Media → Cloudinary
| Type | Folder | Max Size | Formats |
|------|--------|----------|---------|
| Product Images | `revamp/products` | 10MB | jpg, png, webp |
| Project Images | `revamp/projects` | 10MB | jpg, png, webp |
| Blog Images | `revamp/blog` | 10MB | jpg, png, webp |
| Profile Pictures | `revamp/profiles` | 5MB | jpg, png, webp |
| Logos | `revamp/logos` | 2MB | jpg, png, webp, svg |
| Videos | `revamp/videos` | 100MB | mp4, webm, mov |

### Sensitive Documents → AWS S3 (Encrypted)
| Type | Folder | Max Size | Formats | Encryption |
|------|--------|----------|---------|-----------|
| Contracts | `contracts` | 20MB | pdf, docx, doc | ✓ AES256 |
| Invoices | `invoices` | 10MB | pdf | ✓ AES256 |
| Quotes | `quotes` | 10MB | pdf, docx, doc | ✓ AES256 |
| Certificates | `certificates` | 5MB | pdf, jpg, png | ✓ AES256 |
| Bank Documents | `bank-documents` | 20MB | pdf, jpg, png | ✓ AES256 |
| Trade Licenses | `trade-licenses` | 10MB | pdf, jpg, png | ✓ AES256 |
| Tax Documents | `tax-documents` | 20MB | pdf | ✓ AES256 |
| Passports | `passports` | 10MB | pdf, jpg, png | ✓ AES256 |

---

## Architecture

```
User File Upload
    ↓
/api/media/upload (route.ts)
    ↓
    ├─→ Public Media?
    │   ├─→ uploadToCloudinary()
    │   └─→ Returns: { url, publicId, secureUrl }
    │
    └─→ Sensitive Document?
        ├─→ uploadToS3()
        ├─→ Auto-encrypt
        ├─→ Add metadata
        └─→ Returns: { key, uri }
```

---

## Security Features

### Cloudinary
- ✅ Public URLs for web display
- ✅ CDN caching for performance
- ✅ Automatic format optimization
- ✅ Transformation support (resizing, cropping)

### AWS S3
- 🔒 AES256 encryption at rest
- 🔒 User ID and timestamp tracking
- 🔒 Server-side encryption enforced
- 🔒 Infrequent access storage (cost savings)
- 🔒 Versioning support
- 🔒 Signed URLs for temporary access
- 🔒 File type validation
- 🔒 Size limits enforced

---

## Usage Examples

### 1. Product Image Upload
```tsx
import { MediaUploader } from '@/components/media-uploader';

export function ProductImageUpload() {
  return (
    <MediaUploader
      type="public"
      mediaType="productImages"
      onUploadComplete={(result) => {
        // Save result.url to database
        console.log('Product image:', result.url);
      }}
      onError={(error) => {
        console.error('Upload failed:', error);
      }}
    />
  );
}
```

### 2. Contract Upload
```tsx
export function ContractUpload({ userId }: { userId: string }) {
  return (
    <MediaUploader
      type="sensitive"
      documentType="contracts"
      onUploadComplete={(result) => {
        // Save result.key to database
        console.log('Contract stored:', result.key);
      }}
    />
  );
}
```

### 3. Direct Upload with Validation
```typescript
import { uploadToCloudinary } from '@/lib/media/cloudinary';

async function uploadProductImage(file: File) {
  const result = await uploadToCloudinary({
    mediaType: 'productImages',
    file,
    fileName: `product-${Date.now()}`,
    tags: ['product', 'ecommerce'],
  });

  if (result.success) {
    return result.secureUrl;
  } else {
    throw new Error(result.error);
  }
}
```

### 4. Document Access with Signed URLs
```typescript
import { getS3SignedUrl } from '@/lib/media/aws-s3';

async function getContractDownloadUrl(s3Key: string) {
  // Get time-limited URL (1 hour)
  const signedUrl = await getS3SignedUrl(s3Key, 3600);
  return signedUrl; // Use for download link
}
```

---

## Environment Variables Checklist

### What You Need to Provide

**Cloudinary (4 variables):**
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- ✅ `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- ✅ `CLOUDINARY_API_KEY`
- ✅ `CLOUDINARY_API_SECRET`

**AWS S3 (5 variables):**
- ✅ `AWS_REGION`
- ✅ `AWS_S3_BUCKET_NAME`
- ✅ `AWS_S3_BUCKET_REGION`
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`

**See:** `MEDIA_UPLOAD_ENV_VARIABLES.md` for detailed setup instructions

---

## API Endpoint

### POST /api/media/upload

**Request:**
```json
FormData {
  file: File,
  mediaType?: string,        // For public media
  documentType?: string,     // For sensitive documents
  userId?: string           // Optional, for sensitive docs
}
```

**Success Response:**
```json
{
  "success": true,
  "type": "cloudinary|aws-s3",
  "url": "https://res.cloudinary.com/...",    // Cloudinary only
  "publicId": "revamp/products/...",          // Cloudinary only
  "key": "sensitive/contracts/...",           // AWS S3 only
  "uri": "s3://bucket/sensitive/..."          // AWS S3 only
}
```

**Error Response:**
```json
{
  "error": "File too large | Invalid format | Upload failed"
}
```

---

## Performance Optimization

### Cloudinary
- CDN delivery (fast global access)
- Automatic format conversion (WebP, etc.)
- Lazy loading with blur placeholders
- Responsive images with srcset
- Caching headers (30 days)

### AWS S3
- S3 Transfer Acceleration (optional)
- CloudFront CDN (optional, for frequently accessed docs)
- Infrequent access storage tier (cost reduction)
- Versioning for recovery

---

## Monitoring & Logging

All uploads are logged with `[v0]` prefix:
```
[v0] Cloudinary upload error: ...
[v0] AWS S3 upload error: ...
[v0] Upload API error: ...
```

Monitor in:
- Local: Browser console
- Production: Vercel Logs or Sentry

---

## Cost Estimates

### Cloudinary (Free tier includes)
- 25GB storage
- 25GB bandwidth/month
- Good for most product images

### AWS S3 (Estimated costs)
- $0.023/GB/month (storage)
- $0.001 per 1000 requests
- $0.0004/GB (outbound transfer)
- Example: 10GB of documents = ~$0.25/month

---

## Next Steps

1. **Get your credentials** from Cloudinary and AWS
2. **Add environment variables** to .env.local
3. **Test locally** with the MediaUploader component
4. **Deploy to Vercel** with production environment variables
5. **Monitor uploads** in both service dashboards

---

## Support

- **Cloudinary Issues:** https://support.cloudinary.com
- **AWS S3 Issues:** https://support.aws.amazon.com
- **App Issues:** Check logs with `[v0]` prefix

See **MEDIA_UPLOAD_ENV_VARIABLES.md** for detailed troubleshooting.
