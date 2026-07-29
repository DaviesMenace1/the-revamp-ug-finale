/**
 * Media Upload API Route
 * Handles routing uploads to Cloudinary (public) or AWS S3 (sensitive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/media/cloudinary';
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
      // Public media → Cloudinary
      const result = await uploadToCloudinary({
        mediaType: mediaType as keyof typeof MEDIA_TYPES.PUBLIC,
        file,
        fileName: file.name,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          type: 'cloudinary',
          url: result.secureUrl,
          publicId: result.publicId,
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
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
