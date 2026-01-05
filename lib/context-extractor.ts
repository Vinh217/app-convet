import OpenAI from 'openai';

export interface ExtractedContext {
  characters: Array<{ name: string; description: string; personality?: string }>;
  terms: Array<{ term: string; meaning: string }>;
  settings: Array<{ location: string; description: string }>;
  plotPoints: Array<{ point: string; description: string }>;
}

export async function extractContextFromChapter(
  chapterContent: string,
  apiKey: string,
  model: string = 'deepseek-chat'
): Promise<ExtractedContext> {
  try {
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });

    const extractStartTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `Bạn là một chuyên gia phân tích truyện huyền huyễn. Nhiệm vụ của bạn là trích xuất thông tin quan trọng từ chương truyện để xây dựng knowledge base cho việc dịch các chương sau.

Hãy phân tích và trích xuất:
1. Nhân vật: Tên, mô tả ngắn, tính cách (nếu có)
2. Thuật ngữ: Các từ ngữ đặc biệt, công pháp, pháp bảo, cảnh giới...
3. Bối cảnh: Địa điểm, không gian xuất hiện
4. Tình tiết: Các sự kiện quan trọng trong chương

Trả về dưới dạng JSON với format:
{
  "characters": [{"name": "...", "description": "...", "personality": "..."}],
  "terms": [{"term": "...", "meaning": "..."}],
  "settings": [{"location": "...", "description": "..."}],
  "plotPoints": [{"point": "...", "description": "..."}]
}`,
        },
        {
          role: 'user',
          content: `Hãy phân tích và trích xuất thông tin từ chương truyện sau:\n\n${chapterContent.substring(0, 4000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    });
    const extractEndTime = Date.now();
    const extractDuration = ((extractEndTime - extractStartTime) / 1000).toFixed(2);

    // Log token usage
    const usage = completion.usage;
    if (usage) {
      console.log(`[CONTEXT] Token Usage - Input: ${usage.prompt_tokens}, Output: ${usage.completion_tokens}, Total: ${usage.total_tokens}, Time: ${extractDuration}s`);
    } else {
      console.log(`[CONTEXT] Context extraction completed in ${extractDuration}s (token usage not available)`);
    }

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from context extraction');
    }

    const extracted = JSON.parse(responseText) as ExtractedContext;
    return extracted;
  } catch (error) {
    console.error('Error extracting context:', error);
    // Trả về empty context nếu lỗi
    return {
      characters: [],
      terms: [],
      settings: [],
      plotPoints: [],
    };
  }
}

export function mergeContexts(
  existing: ExtractedContext,
  newContext: ExtractedContext
): ExtractedContext {
  // Merge characters (tránh trùng lặp theo tên)
  const characterMap = new Map<string, { name: string; description: string; personality?: string }>();
  [...existing.characters, ...newContext.characters].forEach(char => {
    const key = char.name.toLowerCase().trim();
    if (!characterMap.has(key) || char.description.length > (characterMap.get(key)?.description.length || 0)) {
      characterMap.set(key, char);
    }
  });

  // Merge terms (tránh trùng lặp)
  const termMap = new Map<string, { term: string; meaning: string }>();
  [...existing.terms, ...newContext.terms].forEach(term => {
    const key = term.term.toLowerCase().trim();
    if (!termMap.has(key) || term.meaning.length > (termMap.get(key)?.meaning.length || 0)) {
      termMap.set(key, term);
    }
  });

  // Merge settings
  const settingMap = new Map<string, { location: string; description: string }>();
  [...existing.settings, ...newContext.settings].forEach(setting => {
    const key = setting.location.toLowerCase().trim();
    if (!settingMap.has(key) || setting.description.length > (settingMap.get(key)?.description.length || 0)) {
      settingMap.set(key, setting);
    }
  });

  return {
    characters: Array.from(characterMap.values()),
    terms: Array.from(termMap.values()),
    settings: Array.from(settingMap.values()),
    plotPoints: [...existing.plotPoints, ...newContext.plotPoints].slice(-20), // Giữ 20 plot points gần nhất
  };
}

