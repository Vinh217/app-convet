'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PlusCircleIcon, 
  GlobeAltIcon, 
  BookOpenIcon, 
  Bars3Icon, 
  XMarkIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Truyện Của Tôi', href: '/', icon: HomeIcon },
  { name: 'Thêm Truyện', href: '/stories/add', icon: PlusCircleIcon },
  { name: 'Crawl Truyện', href: '/crawl', icon: CloudArrowDownIcon },
  { name: 'Dịch Truyện', href: '/translate', icon: GlobeAltIcon },
  { name: 'Đọc Truyện', href: '/read', icon: BookOpenIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-xl text-zinc-900 dark:text-zinc-50">App Truyện</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:overflow-y-auto
        ${isOpen ? 'translate-x-0 pt-16' : '-translate-x-full lg:pt-0'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden lg:flex items-center gap-2 mb-10 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">App Truyện</span>
          </div>

          <nav className="space-y-1 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 px-2">
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">DeepSeek API Usage</p>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">450 / 1000 requests</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
