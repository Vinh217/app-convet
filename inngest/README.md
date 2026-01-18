# Inngest Background Jobs

Dự án này sử dụng Inngest để xử lý các tác vụ chạy lâu trong background, tránh timeout từ server.

## Functions

### 1. `crawlChapters` - Crawl nội dung chương

**Event:** `chapters/crawl`

**Payload:**
```typescript
{
  chapterIds: string[];  // Danh sách chapter IDs cần crawl
  selectors?: {          // Optional custom selectors
    titleSelector: string;
    contentSelector: string;
  };
}
```

**Features:**
- Crawl nhiều chapters tuần tự
- Tự động retry nếu lỗi (3 lần)
- Delay 1 giây giữa mỗi chapter để tránh rate limit
- Skip chapters đã có content
- Tự động detect website preset hoặc dùng fallback selectors

**Usage:**
```typescript
import { inngest } from '@/inngest/client';

await inngest.send({
  name: 'chapters/crawl',
  data: {
    chapterIds: ['id1', 'id2', 'id3'],
  },
});
```

### 2. `translateChapter` - Dịch nội dung chương

**Event:** `chapter/translate`

**Payload:**
```typescript
{
  chapterId: string;
  model?: string;  // Default: 'deepseek-chat'
}
```

**Features:**
- Dịch nội dung chương với context từ các chương trước
- Extract và update context tự động
- Cập nhật status: pending → translating → completed

## Development

### Local Testing

1. Install Inngest Dev Server:
```bash
npx inngest-cli@latest dev
```

2. Chạy Next.js app:
```bash
npm run dev
```

3. Inngest Dev UI sẽ chạy ở `http://localhost:8288`

### Environment Variables

Không cần config gì thêm cho development. Inngest tự động detect và chạy local.

Với production, cần thêm:
```bash
INNGEST_EVENT_KEY=your-production-event-key
INNGEST_SIGNING_KEY=your-production-signing-key
```

## Monitoring

- **Development:** Xem logs tại Inngest Dev UI (http://localhost:8288)
- **Production:** Xem logs tại Inngest Dashboard (https://app.inngest.com)

## Adding New Functions

1. Tạo file mới trong `inngest/` folder:
```typescript
// inngest/myFunction.ts
import { inngest } from './client';

export const myFunctionFn = inngest.createFunction(
  { id: 'my-function' },
  { event: 'my/event' },
  async ({ event, step }) => {
    // Your logic here
  }
);
```

2. Register trong `app/api/inngest/route.ts`:
```typescript
import { myFunctionFn } from '@/inngest/myFunction';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    translateChapterFn,
    crawlChaptersFn,
    myFunctionFn,  // Add here
  ],
});
```

3. Trigger từ anywhere:
```typescript
await inngest.send({
  name: 'my/event',
  data: { ... },
});
```
