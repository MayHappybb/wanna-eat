'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User, Save, AlertCircle, Check } from 'lucide-react';

export default function SettingsPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  async function fetchUserInfo() {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
        setOriginalUsername(data.username);
        setDisplayName(data.display_name);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.trim() === originalUsername) {
      setSuccess('No changes made');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setOriginalUsername(data.username);
        setSuccess('Username updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update username');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
              <p className="text-sm text-gray-500">Update your username</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-600">
              <Check className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your username"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is how others will identify you in the team.
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Display name cannot be changed.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving || username.trim() === originalUsername}
                className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Update Username'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Note</h3>
          <p className="text-sm text-blue-700">
            Changing your username will update it across all team interactions immediately.
            Your chat history and eating records will remain intact.
          </p>
        </div>
      </div>
    </div>
  );
}
