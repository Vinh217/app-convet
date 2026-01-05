import OpenAI from 'openai';
import type { StoryContext } from './models';

export async function translateWithDeepSeek(
  text: string,
  apiKey: string,
  model: string = 'deepseek-chat',
  context?: StoryContext | null
): Promise<string> {
  try {
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });

    // Xây dựng context prompt
    let contextPrompt = '';
    if (context) {
      const contextParts: string[] = [];
      
      if (context.characters && context.characters.length > 0) {
        contextParts.push('NHÂN VẬT:');
        context.characters.forEach(char => {
          contextParts.push(`- ${char.name}: ${char.description}${char.personality ? ` (Tính cách: ${char.personality})` : ''}`);
        });
      }
      
      if (context.terms && context.terms.length > 0) {
        contextParts.push('\nTHUẬT NGỮ:');
        context.terms.forEach(term => {
          contextParts.push(`- ${term.term}: ${term.meaning}`);
        });
      }
      
      if (context.settings && context.settings.length > 0) {
        contextParts.push('\nBỐI CẢNH:');
        context.settings.forEach(setting => {
          contextParts.push(`- ${setting.location}: ${setting.description}`);
        });
      }
      
      if (context.plotPoints && context.plotPoints.length > 0) {
        contextParts.push('\nTÌNH TIẾT QUAN TRỌNG:');
        context.plotPoints.slice(-5).forEach(plot => { // Chỉ lấy 5 tình tiết gần nhất
          contextParts.push(`- ${plot.point}: ${plot.description}`);
        });
      }
      
      if (contextParts.length > 0) {
        contextPrompt = `\n\nTHÔNG TIN NGỮ CẢNH TỪ CÁC CHƯƠNG TRƯỚC:\n${contextParts.join('\n')}\n\nHãy sử dụng thông tin này để đảm bảo tính nhất quán trong dịch thuật (tên nhân vật, thuật ngữ, bối cảnh phải giống nhau).`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `Hãy đóng vai biên dịch viên truyện huyền huyễn Trung Quốc chuyên nghiệp, có kinh nghiệm xử lý truyện nhiệt huyết – phản phái – đông phương huyền huyễn, dành cho độc giả nam.

            Nhiệm vụ của bạn là dịch và biên tập truyện convert Trung → Việt theo các tiêu chí sau:

            1. Về nội dung
            - Dịch đúng ý gốc, không lược bỏ tình tiết quan trọng
            - Giữ nguyên logic thế giới, tu luyện, cảnh giới, kỹ năng
            - Nhân vật chính tư duy quyết đoán, lạnh lùng khi cần

            2. Về văn phong
            - Văn phong trôi chảy, tự nhiên như truyện sáng tác tiếng Việt
            - Mang màu sắc nhiệt huyết, bá đạo, sát phạt rõ ràng
            - Phù hợp góc nhìn nam, không nữ tính hóa câu chữ
            - Tránh văn dịch máy, tránh cứng, tránh Hán Việt rườm rà

            3. Về thuật ngữ
            - Giữ nguyên các thuật ngữ phổ biến trong truyện huyền huyễn: tu vi, cảnh giới, công pháp, pháp bảo, linh khí…
            - Danh xưng, tên riêng giữ nguyên âm Hán Việt quen dùng
            - QUAN TRỌNG: Sử dụng đúng các thuật ngữ và tên nhân vật đã được định nghĩa trong context

            4. Cách trình bày
            - Chia đoạn rõ ràng, dễ đọc
            - Hội thoại xuống dòng, không gộp rối
            - Không thêm bình luận của người dịch

            5. Yêu cầu đặc biệt
            - Không "dịch word-by-word", mà dịch theo ngữ cảnh
            - Ưu tiên cảm xúc, khí thế, nhịp truyện${contextPrompt}`,
        },
        {
          role: 'user',
          content: `Hãy dịch và biên tập đoạn văn sau theo các tiêu chí trên:\n\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const translatedText = completion.choices[0]?.message?.content;
    if (!translatedText) {
      throw new Error('No translation returned from DeepSeek API');
    }

    return translatedText.trim();
  } catch (error: unknown) {
    console.error('Error translating with DeepSeek:', error);
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      throw new Error(
        `DeepSeek API error: ${(error as { status: unknown }).status} - ${(error as { message: string }).message}`
      );
    }
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Hàm chia nhỏ văn bản để dịch từng phần (tránh vượt quá giới hạn token)
export function splitTextIntoChunks(text: string, maxChunkSize: number = 8000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function translateLongText(
  text: string,
  apiKey: string,
  model: string = 'deepseek-chat',
  context?: StoryContext | null
): Promise<string> {
  const chunks = splitTextIntoChunks(text);
  const translatedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.time(`translateLongText-chunk-${i}`);
    console.log(`Translating chunk ${i + 1}/${chunks.length}...`);
    const translated = await translateWithDeepSeek(chunks[i], apiKey, model, context);
    console.timeEnd(`translateLongText-chunk-${i}`);
    translatedChunks.push(translated);

    // Delay giữa các request để tránh rate limit
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return translatedChunks.join('\n\n');
}

