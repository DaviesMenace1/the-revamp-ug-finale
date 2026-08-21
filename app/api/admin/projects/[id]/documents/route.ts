import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projectDocuments, projectActivity, projects } from "@/lib/db/schema"
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

    const documents = await db
      .select()
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId))
      .orderBy(desc(projectDocuments.createdAt))

    return NextResponse.json({ success: true, documents })
  } catch (error) {
    console.error("Failed to load project documents:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load project documents." },
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
      columns: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const name = formData.get("name") as string | null
    const category = (formData.get("category") as string) || "general"
    const visibility = (formData.get("visibility") as string) || "client"
    const signatureStatus = (formData.get("signatureStatus") as string) || "n/a"

    if (!file || !name) {
      return NextResponse.json(
        { success: false, error: "File and name are required." },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadResult = await uploadToR2(buffer, {
      projectId,
      category: "documents",
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    })

    const admin = await getOrCreateCurrentUser()

    const [document] = await db
      .insert(projectDocuments)
      .values({
        projectId,
        name,
        category,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        storageProvider: "r2",
        visibility,
        signatureStatus,
        uploadedBy: admin?.id || null,
      })
      .returning()

    await db.insert(projectActivity).values({
      projectId,
      actorUserId: admin?.id || null,
      actorType: "admin",
      action: "document_uploaded",
      summary: `${name} was uploaded`,
    })

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error) {
    console.error("Failed to upload project document:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload project document." },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { documentId, signatureStatus } = body

    if (!documentId || !signatureStatus) {
      return NextResponse.json(
        { success: false, error: "Document ID and signature status are required." },
        { status: 400 },
      )
    }

    const document = await db.query.projectDocuments.findFirst({
      where: and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)),
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found." },
        { status: 404 },
      )
    }

    await db
      .update(projectDocuments)
      .set({ signatureStatus })
      .where(eq(projectDocuments.id, documentId))

    await db.insert(projectActivity).values({
      projectId,
      action: "document_signature_updated",
      actorType: "admin",
      summary: `${document.name} marked as ${signatureStatus}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update signature status:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update signature status." },
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
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required." },
        { status: 400 },
      )
    }

    const document = await db.query.projectDocuments.findFirst({
      where: and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)),
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found." },
        { status: 404 },
      )
    }

    if (document.storageProvider === "r2") {
      const key = keyFromR2Url(document.fileUrl)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch (err) {
          console.error("Failed to delete R2 object (continuing):", err)
        }
      }
    }

    await db.delete(projectDocuments).where(eq(projectDocuments.id, documentId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete project document:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete project document." },
      { status: 500 },
    )
  }
}