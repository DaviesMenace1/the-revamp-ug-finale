/**
 * AWS S3 Upload Handler
 * Handles sensitive document uploads (contracts, invoices, certificates, etc.)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { AWS_S3_CONFIG, MEDIA_TYPES, UPLOAD_ERRORS } from './config';

// Initialize S3 Client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!AWS_S3_CONFIG.accessKeyId || !AWS_S3_CONFIG.secretAccessKey) {
      throw new Error(UPLOAD_ERRORS.MISSING_CONFIG);
    }

    s3Client = new S3Client({
      region: AWS_S3_CONFIG.bucketRegion,
      credentials: {
        accessKeyId: AWS_S3_CONFIG.accessKeyId,
        secretAccessKey: AWS_S3_CONFIG.secretAccessKey,
      },
    });
  }
  return s3Client;
}

interface S3UploadOptions {
  documentType: keyof typeof MEDIA_TYPES.SENSITIVE;
  file: File | Buffer;
  fileName: string;
  userId?: string;
  metadata?: Record<string, string>;
}

interface S3UploadResponse {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

/**
 * Encrypt sensitive data
 */
function encryptData(data: Buffer, key: string): Buffer {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
}

/**
 * Generate S3 key for document
 */
function generateS3Key(
  documentType: string,
  fileName: string,
  userId?: string
): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const folder = userId ? `${documentType}/${userId}` : documentType;
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `sensitive/${folder}/${timestamp}-${random}-${sanitizedFileName}`;
}

/**
 * Upload file to AWS S3
 */
export async function uploadToS3(
  options: S3UploadOptions
): Promise<S3UploadResponse> {
  try {
    // Validate configuration
    if (!AWS_S3_CONFIG.accessKeyId || !AWS_S3_CONFIG.secretAccessKey || !AWS_S3_CONFIG.bucket) {
      console.error('[v0] AWS S3 config missing');
      return {
        success: false,
        error: UPLOAD_ERRORS.MISSING_CONFIG,
      };
    }

    const docConfig = MEDIA_TYPES.SENSITIVE[options.documentType];
    if (!docConfig) {
      return {
        success: false,
        error: UPLOAD_ERRORS.INVALID_TYPE,
      };
    }

    // Convert File to buffer if needed
    let buffer: Buffer;
    if (options.file instanceof File) {
      buffer = Buffer.from(await options.file.arrayBuffer());
    } else {
      buffer = options.file;
    }

    // File size validation
    if (buffer.length > docConfig.maxSize) {
      return {
        success: false,
        error: UPLOAD_ERRORS.FILE_TOO_LARGE,
      };
    }

    // Encrypt sensitive data
    let uploadBuffer = buffer;
    if (docConfig.encryption) {
      const encryptionKey = AWS_S3_CONFIG.secretAccessKey;
      uploadBuffer = encryptData(buffer, encryptionKey);
    }

    // Generate S3 key
    const s3Key = generateS3Key(docConfig.folder, options.fileName, options.userId);

    // Upload to S3
    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: AWS_S3_CONFIG.bucket,
      Key: s3Key,
      Body: uploadBuffer,
      ContentType: options.file instanceof File ? options.file.type : 'application/octet-stream',
      Metadata: {
        'document-type': options.documentType,
        'uploaded-by': options.userId || 'system',
        'uploaded-at': new Date().toISOString(),
        'encrypted': docConfig.encryption ? 'true' : 'false',
        ...options.metadata,
      },
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA', // Infrequent Access for cost savings
    });

    await s3.send(command);

    return {
      success: true,
      key: s3Key,
      url: `s3://${AWS_S3_CONFIG.bucket}/${s3Key}`,
    };
  } catch (error) {
    console.error('[v0] AWS S3 upload error:', error);
    return {
      success: false,
      error: UPLOAD_ERRORS.AWS_ERROR,
    };
  }
}

/**
 * Get signed URL for accessing sensitive document
 */
export async function getS3SignedUrl(
  s3Key: string,
  expirationSeconds: number = 3600
): Promise<string | null> {
  try {
    if (!AWS_S3_CONFIG.bucket) {
      console.error('[v0] AWS S3 bucket name missing');
      return null;
    }

    const s3 = getS3Client();
    const command = new GetObjectCommand({
      Bucket: AWS_S3_CONFIG.bucket,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: expirationSeconds });
    return url;
  } catch (error) {
    console.error('[v0] S3 signed URL error:', error);
    return null;
  }
}

/**
 * Delete file from AWS S3
 */
export async function deleteFromS3(s3Key: string): Promise<boolean> {
  try {
    if (!AWS_S3_CONFIG.bucket) {
      console.error('[v0] AWS S3 bucket name missing');
      return false;
    }

    const s3 = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_CONFIG.bucket,
      Key: s3Key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    console.error('[v0] S3 delete error:', error);
    return false;
  }
}

/**
 * Get S3 file info
 */
export function getS3FileInfo(s3Key: string): {
  bucket: string;
  key: string;
  uri: string;
} {
  return {
    bucket: AWS_S3_CONFIG.bucket || '',
    key: s3Key,
    uri: `s3://${AWS_S3_CONFIG.bucket}/${s3Key}`,
  };
}
