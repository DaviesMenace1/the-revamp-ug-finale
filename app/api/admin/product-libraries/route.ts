import { NextResponse } from "next/server"
import {
  colorLibrary,
  materialLibrary,
  fabricLibrary,
  finishLibrary,
} from "@/lib/db"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { requireAdminApi } from "@/lib/auth/api"

export async function GET() {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const colors = await db
      .select()
      .from(colorLibrary)
      .where(eq(colorLibrary.active, true))
      .orderBy(asc(colorLibrary.name))
    const materials = await db
      .select()
      .from(materialLibrary)
      .where(eq(materialLibrary.active, true))
      .orderBy(asc(materialLibrary.name))
    const fabrics = await db
      .select()
      .from(fabricLibrary)
      .where(eq(fabricLibrary.active, true))
      .orderBy(asc(fabricLibrary.name))
    const finishes = await db
      .select()
      .from(finishLibrary)
      .where(eq(finishLibrary.active, true))
      .orderBy(asc(finishLibrary.name))

    return NextResponse.json({
      success: true,
      colors,
      materials,
      fabrics,
      finishes,
    })
  } catch (error) {
    console.error(
      "Failed to load product libraries:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load product libraries.",
      },
      {
        status: 500,
      },
    )
  }
}
