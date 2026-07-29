# Media Upload - Environment Variables Checklist

Complete this checklist to enable media uploads to Cloudinary (public media) and AWS S3 (sensitive documents).

## ✅ What You Need to Provide

### 1. Cloudinary Environment Variables

Get these from: https://dashboard.cloudinary.com/settings

```bash
# Public variables (safe to expose)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Secret variables (server-side only)
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get these:**
1. Go to https://dashboard.cloudinary.com/settings
2. Find "Cloud name" → copy to `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
3. Go to "Upload" tab → find "Upload presets" section
4. Create a new preset or use existing → copy name to `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
5. Go to "Account" tab → find API Key and API Secret

---

### 2. AWS S3 Environment Variables

Get these from: AWS IAM Console

```bash
# AWS Region (e.g., us-east-1, eu-west-1)
AWS_REGION=us-east-1
AWS_S3_BUCKET_REGION=us-east-1

# S3 Bucket Name
AWS_S3_BUCKET_NAME=your-bucket-name

# IAM User Credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**How to get these:**

1. **Create S3 Bucket:**
   - Go to AWS S3 console
   - Click "Create bucket"
   - Name: `therevampug-sensitive-documents`
   - Region: Choose closest to users (e.g., `us-east-1`)
   - Enable versioning (for safety)
   - Enable server-side encryption
   - Copy bucket name → `AWS_S3_BUCKET_NAME`
   - Copy region → `AWS_S3_BUCKET_REGION` and `AWS_REGION`

2. **Create IAM User for S3 Access:**
   - Go to AWS IAM console
   - Click "Users" → "Create user"
   - Name: `revamp-s3-uploader`
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Copy Access Key ID → `AWS_ACCESS_KEY_ID`
   - Copy Secret Access Key → `AWS_SECRET_ACCESS_KEY` (save immediately!)

3. **Attach S3 Policy to IAM User:**
   - Go to user's "Permissions"
   - Click "Add permissions" → "Create inline policy"
   - Paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::therevampug-sensitive-documents/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::therevampug-sensitive-documents"
       }
     ]
   }
   ```

---

## 🔒 Security Best Practices

### Cloudinary
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - OK to expose
- ✅ `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - OK to expose
- ❌ `CLOUDINARY_API_KEY` - NEVER expose, server-only
- ❌ `CLOUDINARY_API_SECRET` - NEVER expose, server-only

### AWS S3
- ❌ `AWS_ACCESS_KEY_ID` - NEVER expose, server-only
- ❌ `AWS_SECRET_ACCESS_KEY` - NEVER expose, server-only
- ✅ `AWS_S3_BUCKET_NAME` - OK to expose
- ✅ `AWS_REGION` - OK to expose

**In .env.local:**
```
# Public (can be in frontend code)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=abc123
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=my_preset

# Secret (server-side only)
CLOUDINARY_API_KEY=sk_live_xxxxx
CLOUDINARY_API_SECRET=sk_secret_xxxxx
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=therevampug-sensitive-documents
AWS_S3_BUCKET_REGION=us-east-1
```

**In Vercel (for production):**
Add the same variables in Settings → Environment Variables

---

## 📋 Media Type Routing

### Public Media → Cloudinary
- ✅ Product images
- ✅ Project portfolio images
- ✅ Blog post images
- ✅ User profile pictures
- ✅ Logos and icons
- ✅ Videos (products, projects)

### Sensitive Documents → AWS S3 (Encrypted)
- 🔒 Contracts
- 🔒 Invoices & receipts
- 🔒 Price quotes
- 🔒 Certifications & licenses
- 🔒 Bank statements
- 🔒 Trade licenses
- 🔒 Tax documents
- 🔒 Passports & IDs

---

## 🚀 Setup Checklist

### Phase 1: Cloudinary Setup (30 minutes)
- [ ] Create Cloudinary account at cloudinary.com
- [ ] Get Cloud Name
- [ ] Create Upload Preset (allow all formats)
- [ ] Get API Key and Secret
- [ ] Add to .env.local (4 variables)
- [ ] Test with: `npm run test:cloudinary`

### Phase 2: AWS S3 Setup (45 minutes)
- [ ] Create AWS account (if not exists)
- [ ] Create S3 bucket
- [ ] Enable versioning and encryption
- [ ] Create IAM user for S3
- [ ] Generate access keys
- [ ] Attach S3 permissions policy
- [ ] Add to .env.local (5 variables)
- [ ] Test with: `npm run test:aws-s3`

### Phase 3: Deployment (15 minutes)
- [ ] Add all 9 variables to Vercel project settings
- [ ] Redeploy application
- [ ] Test uploads in production

---

## 🧪 Testing Upload Functionality

### Local Testing
```bash
# Test Cloudinary upload
npm run test:cloudinary

# Test AWS S3 upload
npm run test:aws-s3

# Test both together
npm run test:media
```

### Manual Testing in App
1. **Public Media (Cloudinary):**
   - Go to Product upload page
   - Upload product image
   - Verify image appears immediately
   - Check URL format: `https://res.cloudinary.com/...`

2. **Sensitive Documents (AWS S3):**
   - Go to Document upload page
   - Upload contract PDF
   - Verify file is encrypted in S3
   - Check S3 console for file in `sensitive/` folder

---

## ❌ Common Issues & Fixes

### Cloudinary Error: "Upload preset not found"
- Verify `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` is correct
- Preset must exist in Cloudinary dashboard
- Check for typos or extra spaces

### AWS S3 Error: "Access Denied"
- Verify IAM user has correct permissions
- Check access key ID and secret are correct
- Verify bucket name matches exactly
- Check bucket is in correct region

### File Too Large
- Cloudinary max: 100MB (videos), 10MB (images)
- AWS S3 max: 20MB (documents)
- Check file size before uploading

### Missing Environment Variables
- Add variables to .env.local for local dev
- Add variables to Vercel for production
- Variables starting with `NEXT_PUBLIC_` are client-side
- All others are server-only

---

## 📚 API Usage Examples

### Upload Public Media (Cloudinary)
```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('mediaType', 'productImages');

const response = await fetch('/api/media/upload', {
  method: 'POST',
  body: formData,
});

const { url, publicId } = await response.json();
```

### Upload Sensitive Document (AWS S3)
```typescript
const formData = new FormData();
formData.append('file', contractPDF);
formData.append('documentType', 'contracts');
formData.append('userId', currentUserId);

const response = await fetch('/api/media/upload', {
  method: 'POST',
  body: formData,
});

const { key, uri } = await response.json();
```

### Use MediaUploader Component
```tsx
import { MediaUploader } from '@/components/media-uploader';

// Public media
<MediaUploader
  type="public"
  mediaType="productImages"
  onUploadComplete={(result) => console.log('Uploaded:', result.url)}
/>

// Sensitive documents
<MediaUploader
  type="sensitive"
  documentType="contracts"
  onUploadComplete={(result) => console.log('Uploaded:', result.key)}
/>
```

---

## 🔐 Production Checklist

Before going live:
- [ ] All environment variables set in Vercel
- [ ] Cloudinary CDN URLs are HTTPS
- [ ] AWS S3 encryption enabled
- [ ] AWS S3 versioning enabled
- [ ] AWS S3 access logging enabled
- [ ] Test uploads from production URL
- [ ] Monitor S3 costs
- [ ] Set up Cloudinary transformation presets
- [ ] Configure CORS policies if needed
