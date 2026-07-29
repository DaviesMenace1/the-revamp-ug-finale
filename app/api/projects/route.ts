import { NextRequest, NextResponse } from 'next/server';
import { getProjects, getProjectsByType } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    let projects;

    if (type) {
      projects = await getProjectsByType(type);
    } else {
      projects = await getProjects(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: projects,
      page,
      limit,
      count: projects.length,
    });
  } catch (error) {
    console.error('[Projects API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
