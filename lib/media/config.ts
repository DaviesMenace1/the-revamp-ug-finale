/**
 * Media Upload Configuration
 * Handles Cloudflare Images for new public images, Cloudinary for legacy video
 * uploads, and AWS S3 for sensitive documents.
 */

// Cloudinary configuration retained for existing URLs and legacy video uploads.
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Cloudflare Images configuration for all new public image uploads.
export const CLOUDFLARE_IMAGES_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_IMAGES_API_TOKEN,
  deliveryHash: process.env.CLOUDFLARE_IMAGES_DELIVERY_HASH,
};

// AWS S3 Configuration
export const AWS_S3_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  bucketRegion: process.env.AWS_S3_BUCKET_REGION || 'us-east-1',
};

// Media Type Classifications
export const MEDIA_TYPES = {
  // New public images go to Cloudflare. Existing image URLs are never rewritten.
  PUBLIC: {
    productImages: {
      folder: 'revamp/products',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['jpg', 'jpeg', 'png', 'webp'],
      description: 'Product images',
    },
    projectImages: {
      folder: 'revamp/projects',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['jpg', 'jpeg', 'png', 'webp'],
      description: 'Project portfolio images',
    },
    blogImages: {
      folder: 'revamp/blog',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['jpg', 'jpeg', 'png', 'webp'],
      description: 'Blog post images',
    },
    profilePictures: {
      folder: 'revamp/profiles',
      maxSize: 5 * 1024 * 1024, // 5MB
      formats: ['jpg', 'jpeg', 'png', 'webp'],
      description: 'User profile pictures',
    },
    logos: {
      folder: 'revamp/logos',
      maxSize: 2 * 1024 * 1024, // 2MB
      formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
      description: 'Brand logos and icons',
    },
    videos: {
      folder: 'revamp/videos',
      maxSize: 100 * 1024 * 1024, // 100MB
      formats: ['mp4', 'webm', 'mov'],
      description: 'Product and project videos',
    },
  },

  // Sensitive Documents (goes to AWS S3)
  SENSITIVE: {
    contracts: {
      folder: 'contracts',
      maxSize: 20 * 1024 * 1024, // 20MB
      formats: ['pdf', 'docx', 'doc'],
      description: 'Client contracts',
      encryption: true,
    },
    invoices: {
      folder: 'invoices',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['pdf'],
      description: 'Invoices and receipts',
      encryption: true,
    },
    quotes: {
      folder: 'quotes',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['pdf', 'docx', 'doc'],
      description: 'Price quotes',
      encryption: true,
    },
    certificates: {
      folder: 'certificates',
      maxSize: 5 * 1024 * 1024, // 5MB
      formats: ['pdf', 'jpg', 'png'],
      description: 'Certifications and licenses',
      encryption: true,
    },
    bankDocuments: {
      folder: 'bank-documents',
      maxSize: 20 * 1024 * 1024, // 20MB
      formats: ['pdf', 'jpg', 'png'],
      description: 'Bank statements and financial docs',
      encryption: true,
    },
    tradeLicenses: {
      folder: 'trade-licenses',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['pdf', 'jpg', 'png'],
      description: 'Trade license documents',
      encryption: true,
    },
    taxDocuments: {
      folder: 'tax-documents',
      maxSize: 20 * 1024 * 1024, // 20MB
      formats: ['pdf'],
      description: 'Tax returns and compliance docs',
      encryption: true,
    },
    passports: {
      folder: 'passports',
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['pdf', 'jpg', 'png'],
      description: 'Passport and ID scans',
      encryption: true,
    },
  },
};

// Validation Rules
export const UPLOAD_RULES = {
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    document: 20 * 1024 * 1024, // 20MB
  },
  allowedFormats: {
    image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    video: ['mp4', 'webm', 'mov', 'avi'],
    document: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt'],
  },
};

// Cloudinary Transformations (for optimization)
export const CLOUDINARY_TRANSFORMS = {
  productThumbnail: 'c_fill,g_auto,h_300,w_300,q_auto',
  productDisplay: 'c_fill,g_auto,h_800,w_800,q_auto',
  profilePicture: 'c_fill,g_face,h_200,w_200,q_auto,r_max',
  blogHero: 'c_fill,g_auto,h_600,w_1200,q_auto',
};

// Error Messages
export const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FORMAT: 'File format not allowed',
  INVALID_TYPE: 'Invalid file type',
  CLOUDINARY_ERROR: 'Cloudinary upload failed',
  AWS_ERROR: 'AWS S3 upload failed',
  MISSING_CONFIG: 'Upload configuration missing',
};
