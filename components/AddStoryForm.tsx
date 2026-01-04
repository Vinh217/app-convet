'use client';

import { useState } from 'react';

interface AddStoryFormProps {
  onSuccess: () => void;
}

export default function AddStoryForm({ onSuccess }: AddStoryFormProps) {
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
        onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
        Thêm Truyện Mới
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Tiêu đề
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            URL
          </label>
          <input
            type="url"
            required
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Mô tả (tùy chọn)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Tác giả (tùy chọn)
          </label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang thêm...' : 'Thêm Truyện'}
        </button>
        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}

