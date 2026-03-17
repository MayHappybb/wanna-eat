'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { EatingRecord, User } from '@/lib/types';
import { Calendar, Users, Plus, Utensils } from 'lucide-react';

export default function HistoryPage() {
  const [records, setRecords] = useState<(EatingRecord & { creator_name: string; participants: User[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: number; display_name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchRecords();
    fetchUsers();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.map((u: { id: number; display_name: string }) => ({ id: u.id, display_name: u.display_name })));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }

  async function createRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantName.trim()) return;

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: restaurantName.trim(),
          participant_ids: selectedParticipants,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setRestaurantName('');
        setSelectedParticipants([]);
        fetchRecords();
      }
    } catch (error) {
      console.error('Failed to create record:', error);
    }
  }

  function toggleParticipant(userId: number) {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Eating History</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Record Meal</span>
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Utensils className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No eating records yet</h3>
            <p className="text-gray-500 mb-4">Record your first meal to start tracking!</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Record Your First Meal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Utensils className="h-5 w-5 text-blue-600" />
                      <span>{record.restaurant_name}</span>
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(record.ate_at)}</span>
                      </span>
                      <span>{formatTime(record.ate_at)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Recorded by {record.creator_name}</p>
                  </div>
                </div>

                {record.participants && record.participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span>Participants ({record.participants.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {record.participants.map((participant) => (
                        <span
                          key={participant.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                        >
                          {participant.display_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Record a Meal</h2>

            <form onSubmit={createRecord}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Where did you eat?"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who joined? (Optional)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                  {allUsers.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(user.id)}
                        onChange={() => toggleParticipant(user.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{user.display_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
