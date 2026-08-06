/**
 * Cloudinary Upload Handler
 * Handles public media uploads (products, projects, blogs, profiles, etc.)
 */

import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CONFIG, MEDIA_TYPES, UPLOAD_ERRORS } from './config';

// Configure Cloudinary
if (CLOUDINARY_CONFIG.apiKey && CLOUDINARY_CONFIG.apiSecret) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret,
  });
}

interface CloudinaryUploadOptions {
  mediaType: keyof typeof MEDIA_TYPES.PUBLIC;
  file: File | Buffer;
  fileName?: string;
  tags?: string[];
}

interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResponse> {
  try {
    // Validate configuration
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.apiKey) {
      console.error('[v0] Cloudinary config missing');
      return {
        success: false,
        error: UPLOAD_ERRORS.MISSING_CONFIG,
      };
    }

    const mediaConfig = MEDIA_TYPES.PUBLIC[options.mediaType];
    if (!mediaConfig) {
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
    if (buffer.length > mediaConfig.maxSize) {
      return {
        success: false,
        error: UPLOAD_ERRORS.FILE_TOO_LARGE,
      };
    }

    // Upload to Cloudinary
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: mediaConfig.folder,
          resource_type: 'auto',
          tags: [options.mediaType, ...(options.tags || [])],
          public_id: options.fileName ? options.fileName.replace(/\.[^/.]+$/, '') : undefined,
        },
        (error, result) => {
          if (error) {
            console.error('[v0] Cloudinary error:', error);
            resolve({
              success: false,
              error: UPLOAD_ERRORS.CLOUDINARY_ERROR,
            });
          } else {
            resolve({
              success: true,
              url: result?.url,
              secureUrl: result?.secure_url,
              publicId: result?.public_id,
            });
          }
        }
      );

      stream.end(buffer);
    });
  } catch (error) {
    console.error('[v0] Cloudinary upload error:', error);
    return {
      success: false,
      error: UPLOAD_ERRORS.CLOUDINARY_ERROR,
    };
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.apiKey) {
      console.error('[v0] Cloudinary config missing');
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('[v0] Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformation?: string
): string {
  if (!CLOUDINARY_CONFIG.cloudName) {
    console.error('[v0] Cloudinary cloud name missing');
    return '';
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  if (transformation) {
    return `${baseUrl}/${transformation}/${publicId}`;
  }
  return `${baseUrl}/${publicId}`;
}
