import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getPresetByUrl, detectSelectors } from '@/lib/website-presets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, mode } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Kiểm tra preset trước
    const preset = getPresetByUrl(url);
    if (preset) {
      return NextResponse.json({
        success: true,
        data: {
          preset: preset.name,
          selectors: mode === 'single' ? preset.chapterSelectors : preset.listSelectors,
        },
      });
    }

    // Nếu không có preset, thử detect tự động
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      const detected = detectSelectors(response.data, mode === 'single' ? 'chapter' : 'list');

      return NextResponse.json({
        success: true,
        data: {
          preset: null,
          selectors: detected,
          autoDetected: true,
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch and detect selectors',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error detecting selectors:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect',
      },
      { status: 500 }
    );
  }
}

