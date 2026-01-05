import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Chapter } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      titlePattern, 
      findText, 
      replaceText,
      storyId // Optional: filter by storyId
    } = body;

    if (!titlePattern && !findText) {
      return NextResponse.json(
        { success: false, error: 'titlePattern hoặc findText là bắt buộc' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Build query
    const query: any = {};
    
    if (titlePattern) {
      // Support regex pattern
      query.title = { $regex: titlePattern, $options: 'i' };
    }
    
    if (storyId) {
      query.storyId = storyId;
    }

    // Find all matching chapters
    const chapters = await db.collection<Chapter>('chapters')
      .find(query)
      .toArray();

    if (chapters.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          matched: 0,
          updated: 0,
          message: 'Không tìm thấy chapter nào khớp với pattern',
        },
      });
    }

    // Prepare bulk operations
    const bulkOps = chapters
      .map((chapter) => {
        let newTitle = chapter.title;
        
        if (findText && replaceText !== undefined) {
          // Replace text
          newTitle = newTitle.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText);
        } else if (titlePattern) {
          // Remove prefix if title starts with pattern
          const regex = new RegExp(titlePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          newTitle = newTitle.replace(regex, '').trim();
        }

        // Only update if title changed
        if (newTitle !== chapter.title) {
          return {
            updateOne: {
              filter: { _id: chapter._id },
              update: {
                $set: {
                  title: newTitle,
                  updatedAt: new Date(),
                },
              },
            },
          };
        }
        return null;
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    if (bulkOps.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          matched: chapters.length,
          updated: 0,
          message: 'Không có chapter nào cần update (title đã đúng)',
        },
      });
    }

    // Execute bulk update
    const result = await db.collection<Chapter>('chapters').bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      data: {
        matched: chapters.length,
        updated: result.modifiedCount,
        message: `Đã update ${result.modifiedCount}/${chapters.length} chapters`,
      },
    });
  } catch (error) {
    console.error('Error in bulk update title:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk update titles',
      },
      { status: 500 }
    );
  }
}

