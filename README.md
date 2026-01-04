# Hệ thống Quản lý Truyện Convert

Hệ thống crawl truyện convert và dịch lại bằng DeepSeek API để cải thiện văn phong, loại bỏ từ Hán Việt khó hiểu.

## Tính năng

- ✅ Crawl truyện từ các website
- ✅ Lưu trữ trên MongoDB
- ✅ Dịch lại bằng DeepSeek API để cải thiện văn phong
- ✅ Quản lý truyện và chương qua giao diện web
- ✅ Dịch hàng loạt (batch translation)

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env.local` và thêm các biến môi trường:

```env
MONGODB_URI=mongodb://localhost:27017/truyen-convert
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**Lưu ý:** Bạn có thể bỏ qua `DEEPSEEK_API_KEY` trong `.env.local` và nhập trực tiếp trong UI.

### 3. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## Hướng dẫn sử dụng

### 1. Thêm truyện mới

- Nhập tiêu đề, URL, mô tả (tùy chọn) và tác giả (tùy chọn)
- Click "Thêm Truyện"

### 2. Crawl truyện

**Crawl một chương:**
- Chọn truyện từ danh sách
- Nhập URL của chương
- Chọn chế độ "Crawl một chương"
- Nhập CSS selectors:
  - **Title Selector**: Selector cho tiêu đề chương (ví dụ: `h1.title`)
  - **Content Selector**: Selector cho nội dung chương (ví dụ: `div.content p`)
  - **Next Selector**: Selector cho link chương tiếp theo (ví dụ: `a.next`)

**Crawl danh sách chương:**
- Chọn truyện từ danh sách
- Nhập URL trang danh sách chương
- Chọn chế độ "Crawl danh sách chương"
- Nhập CSS selectors:
  - **List Selector**: Selector cho container chứa danh sách (ví dụ: `ul.chapter-list li`)
  - **Title Selector**: Selector cho tiêu đề trong mỗi item (ví dụ: `a`)
  - **Link Selector**: Selector cho link trong mỗi item (ví dụ: `a`)

### 3. Dịch truyện

- Nhập DeepSeek API Key (hoặc dùng từ `.env.local`)
- Chọn số chương muốn dịch mỗi lần (batch limit)
- Click "Dịch Hàng Loạt"

Hệ thống sẽ tự động:
- Lấy các chương có status `pending`
- Dịch từng chương bằng DeepSeek API
- Lưu nội dung đã dịch vào database
- Cập nhật status thành `completed` hoặc `failed`

## Cấu trúc Database

### Collection: `stories`
```typescript
{
  _id: ObjectId,
  title: string,
  originalTitle?: string,
  url: string,
  description?: string,
  author?: string,
  totalChapters?: number,
  crawledChapters?: number,
  status: 'crawling' | 'translating' | 'completed' | 'paused',
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `chapters`
```typescript
{
  _id: ObjectId,
  storyId: string,
  chapterNumber: number,
  title: string,
  originalContent: string,
  translatedContent?: string,
  url: string,
  status: 'pending' | 'translating' | 'completed' | 'failed',
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Stories
- `GET /api/stories` - Lấy danh sách truyện
- `POST /api/stories` - Tạo truyện mới
- `GET /api/stories/[id]` - Lấy thông tin truyện
- `PATCH /api/stories/[id]` - Cập nhật truyện
- `GET /api/stories/[id]/chapters` - Lấy danh sách chương

### Crawl
- `POST /api/crawl` - Crawl truyện/chương

### Translate
- `POST /api/translate` - Dịch một chương
- `POST /api/translate/batch` - Dịch hàng loạt

## Lấy DeepSeek API Key

1. Truy cập [https://platform.deepseek.com](https://platform.deepseek.com)
2. Đăng ký/Đăng nhập
3. Vào phần API Keys
4. Tạo API key mới
5. Copy và sử dụng trong ứng dụng

## Lưu ý

- DeepSeek API có rate limit, hệ thống tự động delay giữa các request
- Văn bản dài sẽ được chia nhỏ để dịch từng phần
- Nên test CSS selectors trước khi crawl hàng loạt
- Backup database thường xuyên

## Công nghệ sử dụng

- **Next.js 16** - Framework React
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Cheerio** - Web scraping
- **Axios** - HTTP client
- **DeepSeek API** - Translation service
- **Tailwind CSS** - Styling
