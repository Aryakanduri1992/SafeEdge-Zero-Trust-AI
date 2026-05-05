import { NextRequest, NextResponse } from 'next/server';
import { ROOM_TEMPLATES, getRoomTemplatesByCategory } from '@/lib/room-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const templates = category 
      ? getRoomTemplatesByCategory(category)
      : ROOM_TEMPLATES;

    const categories = ['workspace', 'meeting', 'utility', 'common', 'technical'];

    return NextResponse.json({
      success: true,
      templates,
      categories,
    });
  } catch (error) {
    console.error('Error fetching room templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch room templates' },
      { status: 500 }
    );
  }
}
