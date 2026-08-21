import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projectAssets, projectActivity, projects } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { uploadToR2, deleteFromR2, keyFromR2Url, isR2Configured } from "@/lib/storage/r2"
import { getOrCreateCurrentUser } from "@/lib/auth/utils"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params

    const assets = await db
      .select()
      .from(projectAssets)
      .where(eq(projectAssets.projectId, projectId))
      .orderBy(desc(projectAssets.createdAt))

    return NextResponse.json({ success: true, assets })
  } catch (error) {
    console.error("Failed to load project assets:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load project assets." },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.",
        },
        { status: 400 },
      )
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true, title: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string | null
    const assetType = (formData.get("assetType") as string) || "image"
    const category = formData.get("category") as string | null
    const description = formData.get("description") as string | null
    const visibility = (formData.get("visibility") as string) || "client"
    const parentAssetId = formData.get("parentAssetId") as string | null

    if (!file || !title) {
      return NextResponse.json(
        { success: false, error: "File and title are required." },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadResult = await uploadToR2(buffer, {
      projectId,
      category: assetType,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    })

    const admin = await getOrCreateCurrentUser()

    // If this is a new version of an existing asset, figure out the next
    // version number and demote the previous "current" version.
    let version = 1
    if (parentAssetId) {
      const siblings = await db
        .select({ version: projectAssets.version })
        .from(projectAssets)
        .where(eq(projectAssets.parentAssetId, parentAssetId))

      version = siblings.length > 0 ? Math.max(...siblings.map((s) => s.version)) + 1 : 2

      await db
        .update(projectAssets)
        .set({ isCurrentVersion: false })
        .where(eq(projectAssets.id, parentAssetId))

      await db
        .update(projectAssets)
        .set({ isCurrentVersion: false })
        .where(eq(projectAssets.parentAssetId, parentAssetId))
    }

    const [asset] = await db
      .insert(projectAssets)
      .values({
        projectId,
        title,
        description: description || null,
        assetType,
        category: category || null,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        storageProvider: "r2",
        version,
        parentAssetId: parentAssetId || null,
        isCurrentVersion: true,
        visibility,
        approvalStatus: "pending",
        uploadedBy: admin?.id || null,
      })
      .returning()

    await db.insert(projectActivity).values({
      projectId,
      actorUserId: admin?.id || null,
      actorType: "admin",
      action: "asset_uploaded",
      summary: `${title} (v${version}) was uploaded`,
      relatedAssetId: asset.id,
    })

    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    console.error("Failed to upload project asset:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload project asset." },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("assetId")

    if (!assetId) {
      return NextResponse.json(
        { success: false, error: "Asset ID is required." },
        { status: 400 },
      )
    }

    const asset = await db.query.projectAssets.findFirst({
      where: and(eq(projectAssets.id, assetId), eq(projectAssets.projectId, projectId)),
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found." },
        { status: 404 },
      )
    }

    if (asset.storageProvider === "r2") {
      const key = keyFromR2Url(asset.fileUrl)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch (err) {
          console.error("Failed to delete R2 object (continuing):", err)
        }
      }
    }

    await db.delete(projectAssets).where(eq(projectAssets.id, assetId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete project asset:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete project asset." },
      { status: 500 },
    )
  }
}