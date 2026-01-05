'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AddStoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    author: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Thêm truyện thành công!' });
        setFormData({ title: '', url: '', description: '', author: '' });
        // Optional: Redirect to home or stay here
        setTimeout(() => router.push('/'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Thêm Truyện Mới</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin truyện</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Tiêu đề"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nhập tên truyện..."
            />
            
            <Input
              label="URL Nguồn"
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/story/..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Tác giả (tùy chọn)"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Tên tác giả"
              />
            </div>

            <Textarea
              label="Mô tả (tùy chọn)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Tóm tắt nội dung truyện..."
            />

            {message && (
              <div
                className={`p-4 rounded-lg text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={loading} size="lg">
                Thêm Truyện
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
