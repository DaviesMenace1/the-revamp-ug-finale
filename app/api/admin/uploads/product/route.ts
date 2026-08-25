import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { requireAdminApi } from "@/lib/auth/api"

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,
  api_key:
    process.env.CLOUDINARY_API_KEY,
  api_secret:
    process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
  request: Request,
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const formData =
      await request.formData()

    const file =
      formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No image file provided.",
        },
        { status: 400 },
      )
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only image files are allowed.",
        },
        { status: 400 },
      )
    }

    const bytes =
      await file.arrayBuffer()

    const buffer =
      Buffer.from(bytes)

    const result =
      await new Promise<any>(
        (
          resolve,
          reject,
        ) => {
          const upload =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  "the-revamp-ug/products",
                resource_type:
                  "image",
                transformation: [
                  {
                    quality:
                      "auto",
                    fetch_format:
                      "auto",
                  },
                ],
              },
              (
                error,
                result,
              ) => {
                if (error) {
                  reject(error)
                } else {
                  resolve(
                    result,
                  )
                }
              },
            )

          upload.end(buffer)
        },
      )

    return NextResponse.json({
      success: true,
      image: {
        url:
          result.secure_url,
        publicId:
          result.public_id,
        width:
          result.width,
        height:
          result.height,
        format:
          result.format,
      },
    })
  } catch (error) {
    console.error(
      "Cloudinary product upload error:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to upload image.",
      },
      { status: 500 },
    )
  }
}