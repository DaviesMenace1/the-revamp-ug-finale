# Media Upload System - Ready to Use

## ✅ Installation Complete

All dependencies installed successfully:
- `cloudinary` - Image optimization & CDN
- `next-cloudinary` - React components for Cloudinary
- `@aws-sdk/client-s3` - AWS S3 client
- `@aws-sdk/s3-request-presigner` - Presigned URL generation

---

## 📁 Files Structure

```
lib/media/
├── config.ts          → Media type definitions & size limits
├── cloudinary.ts      → Cloudinary upload handler
└── aws-s3.ts         → AWS S3 encrypted upload handler

app/api/media/
└── upload/
    └── route.ts       → Smart routing endpoint

components/
└── media-uploader.tsx → Ready-to-use React component
```

---

## 🚀 Quick Start

### 1. Import the Component
```tsx
import { MediaUploader } from '@/components/media-uploader'

export default function MyComponent() {
  return (
    <MediaUploader
      type="product-image"  // or "contract", "invoice", etc.
      onSuccess={(url) => console.log('Uploaded:', url)}
      onError={(error) => console.error(error)}
    />
  )
}
```

### 2. Supported Media Types

**Public Media (Cloudinary):**
- `product-image` - Product photos (10MB max)
- `project-image` - Project portfolio images (10MB max)
- `blog-image` - Blog post images (10MB max)
- `blog-video` - Blog videos (100MB max)
- `profile-image` - User profile pictures (5MB max)
- `logo` - Company/brand logos (5MB max)

**Sensitive Documents (AWS S3 - Encrypted):**
- `contract` - Contracts & agreements (20MB max)
- `invoice` - Invoices (10MB max)
- `quote` - Price quotations (10MB max)
- `certificate` - Certificates (10MB max)
- `bank-document` - Bank documents (10MB max)
- `tax-document` - Tax & financial docs (10MB max)
- `trade-license` - Trade licenses (10MB max)
- `passport` - ID documents (10MB max)

---

## 🔧 Usage Examples

### Product Image Upload
```tsx
import { MediaUploader } from '@/components/media-uploader'

export function ProductForm() {
  const [imageUrl, setImageUrl] = useState('')

  return (
    <div>
      <MediaUploader
        type="product-image"
        onSuccess={setImageUrl}
      />
      {imageUrl && <img src={imageUrl} alt="Product" />}
    </div>
  )
}
```

### Contract Upload (Sensitive)
```tsx
export function ContractUpload() {
  const [contractUrl, setContractUrl] = useState('')

  return (
    <MediaUploader
      type="contract"
      onSuccess={setContractUrl}
      onError={(err) => alert(`Upload failed: ${err.message}`)}
    />
  )
}
```

### Programmatic Upload via API
```tsx
async function uploadMedia(file: File, type: 'product-image' | 'contract') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  return data.url // Returns Cloudinary or S3 URL
}
```

---

## 🔐 What Happens Behind the Scenes

### Public Media (Product Images, Blogs, etc.)
1. File sent to upload endpoint
2. Endpoint routes to Cloudinary handler
3. Image optimized by Cloudinary
4. Returns CDN URL (fast global delivery)
5. Example: `https://res.cloudinary.com/.../{image}.jpg`

### Sensitive Documents (Contracts, Invoices, etc.)
1. File sent to upload endpoint
2. Endpoint routes to AWS S3 handler
3. File encrypted with AES256
4. Stored in private S3 bucket
5. Returns presigned download URL
6. URL expires in 1 hour (configurable)
7. Example: `https://bucket.s3.amazonaws.com/...?X-Amz-Signature=...`

---

## ✅ Environment Variables Verified

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ✓
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ✓
CLOUDINARY_API_KEY ✓
CLOUDINARY_API_SECRET ✓

AWS_REGION ✓
AWS_S3_BUCKET_NAME ✓
AWS_S3_BUCKET_REGION ✓
AWS_ACCESS_KEY_ID ✓
AWS_SECRET_ACCESS_KEY ✓
```

All variables are configured and ready to use.

---

## 🎯 Integration Points

### Where to Add Media Uploaders

**Admin/CMS Area:**
- Product creation form
- Project portfolio upload
- Blog post editor
- Gallery/media library

**Dashboard:**
- Contract uploads
- Invoice uploads
- Certificate uploads
- Document management

**Public Pages:**
- Product images (gallery)
- Project images (portfolio)
- Blog featured images
- Author photos

---

## 🚨 Error Handling

The media uploader includes built-in error handling:

```tsx
<MediaUploader
  type="product-image"
  onSuccess={(url) => {
    console.log('Uploaded successfully:', url)
    // Update database with URL
  }}
  onError={(error) => {
    console.error('Upload failed:', error.message)
    // Show error toast to user
  }}
/>
```

Common errors handled:
- File too large
- Invalid file type
- Network timeout
- Cloudinary/S3 API errors

---

## 📊 Performance Features

**Cloudinary:**
- Automatic image optimization
- Global CDN delivery
- Responsive image generation
- WebP format support
- Lazy loading ready

**AWS S3:**
- Server-side encryption (AES256)
- Presigned URLs (secure access)
- Automatic expiration
- Version control support

---

## 🔗 Integration with Drizzle ORM

Once database is set up, store URLs in your tables:

```typescript
// Example: Product table
{
  id: serial().primaryKey(),
  name: varchar(),
  price: integer(),
  imageUrl: varchar().notNull(), // From Cloudinary
  datasheet: varchar(), // From AWS S3
  createdAt: timestamp(),
}
```

Then when fetching, the URLs are ready to use immediately.

---

## ✨ Next Steps

1. **Test Upload:** Open a page with `<MediaUploader type="product-image" />`
2. **Select a File:** Try uploading a test image
3. **Verify Success:** Check that URL is returned
4. **Try Sensitive:** Upload a PDF to test S3 encryption
5. **Integrate:** Add MediaUploader to your admin forms
6. **Database:** Store returned URLs when database is ready

---

## 📞 Troubleshooting

**Upload not working?**
- Check browser console for errors
- Verify environment variables are loaded
- Check that Cloudinary account is active
- Verify AWS S3 bucket exists and credentials are correct

**File size limit exceeded?**
- Check `lib/media/config.ts` for size limits
- Adjust limits if needed (edit config.ts)

**URLs not loading?**
- For Cloudinary: Verify CDN URL is correct
- For S3: Check presigned URL hasn't expired
- Verify file was uploaded (check Cloudinary dashboard / S3 console)

---

## 🎉 You're All Set!

The media upload system is fully configured and ready to integrate into your pages. All environment variables are in place, dependencies are installed, and components are ready to use.

Start by adding `<MediaUploader />` to your product/project upload forms!
