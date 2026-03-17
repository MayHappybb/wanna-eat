'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Utensils, LogOut, User, History } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Utensils className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Wanna Eat</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/history"
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <History className="h-5 w-5" />
              <span className="hidden sm:inline">History</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
