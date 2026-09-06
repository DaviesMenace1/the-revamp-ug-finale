/**
 * Media Upload API Route
 * Handles routing new public images to Cloudflare, legacy video uploads to
 * Cloudinary, and sensitive documents to AWS S3.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/media/cloudinary';
import { uploadToCloudflare } from '@/lib/media/cloudflare-images';
import { uploadToS3 } from '@/lib/media/aws-s3';
import { MEDIA_TYPES } from '@/lib/media/config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mediaType = formData.get('mediaType') as string;
    const documentType = formData.get('documentType') as string;
    const userId = formData.get('userId') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Route to appropriate service
    if (mediaType && Object.keys(MEDIA_TYPES.PUBLIC).includes(mediaType)) {
      const publicMediaConfig = MEDIA_TYPES.PUBLIC[mediaType as keyof typeof MEDIA_TYPES.PUBLIC];
      if (file.size > publicMediaConfig.maxSize) {
        return NextResponse.json({ error: 'File size exceeds maximum allowed size' }, { status: 400 });
      }

      // New images → Cloudflare. Keep video uploads on the existing provider.
      if (mediaType === 'videos') {
        const result = await uploadToCloudinary({
          mediaType: mediaType as keyof typeof MEDIA_TYPES.PUBLIC,
          file,
          fileName: file.name,
        });
        return result.success
          ? NextResponse.json({ success: true, type: 'cloudinary', url: result.secureUrl, publicId: result.publicId })
          : NextResponse.json({ error: result.error }, { status: 500 });
      }

      const result = await uploadToCloudflare(file, {
        source: 'revamp-media-api',
        mediaType,
        filename: file.name.slice(0, 180),
        contentType: file.type,
      });
      return result.success
        ? NextResponse.json({ success: true, type: 'cloudflare', url: result.deliveryURL, publicId: result.imageId })
        : NextResponse.json({ error: result.error }, { status: result.error?.includes('not configured') ? 503 : 500 });
    } else if (documentType && Object.keys(MEDIA_TYPES.SENSITIVE).includes(documentType)) {
      // Sensitive documents → AWS S3
      const result = await uploadToS3({
        documentType: documentType as keyof typeof MEDIA_TYPES.SENSITIVE,
        file,
        fileName: file.name,
        userId: userId || undefined,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          type: 'aws-s3',
          key: result.key,
          uri: result.url,
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid media or document type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[v0] Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
