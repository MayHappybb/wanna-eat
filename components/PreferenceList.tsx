'use client';

import { useState, useEffect } from 'react';
import { FoodPreference } from '@/lib/types';
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';

export default function PreferenceList() {
  const [preferences, setPreferences] = useState<FoodPreference[]>([]);
  const [newRestaurant, setNewRestaurant] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addPreference() {
    if (!newRestaurant.trim()) return;

    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name: newRestaurant.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreferences([...preferences, data]);
        setNewRestaurant('');
      }
    } catch (error) {
      console.error('Failed to add preference:', error);
    }
  }

  async function deletePreference(id: number) {
    try {
      const res = await fetch(`/api/preferences/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPreferences(preferences.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete preference:', error);
    }
  }

  async function toggleVisibility(id: number, currentValue: number) {
    try {
      const res = await fetch(`/api/preferences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !currentValue }),
      });

      if (res.ok) {
        setPreferences(
          preferences.map((p) =>
            p.id === id ? { ...p, is_public: currentValue ? 0 : 1 } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  }

  async function reorderPreference(id: number, direction: 'up' | 'down') {
    const index = preferences.findIndex((p) => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === preferences.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newPreferences = [...preferences];
    [newPreferences[index], newPreferences[newIndex]] = [newPreferences[newIndex], newPreferences[index]];

    // Update priority orders
    const updates = newPreferences.map((p, i) => ({ id: p.id, priority_order: i }));

    try {
      // Update each preference
      for (const update of updates) {
        await fetch(`/api/preferences/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority_order: update.priority_order }),
        });
      }

      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">My Food Preferences</h3>

      {/* Add new */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newRestaurant}
          onChange={(e) => setNewRestaurant(e.target.value)}
          placeholder="Add a restaurant..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addPreference()}
        />
        <button
          onClick={addPreference}
          disabled={!newRestaurant.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {preferences.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">
            No preferences yet. Add your favorite restaurants!
          </p>
        ) : (
          preferences.map((pref, index) => (
            <div
              key={pref.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{pref.restaurant_name}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => reorderPreference(pref.id, 'up')}
                      disabled={index === 0}
                      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => reorderPreference(pref.id, 'down')}
                      disabled={index === preferences.length - 1}
                      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => toggleVisibility(pref.id, pref.is_public)}
                  className={`p-1.5 rounded transition-colors ${
                    pref.is_public ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-200'
                  }`}
                  title={pref.is_public ? 'Public' : 'Private'}
                >
                  {pref.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => deletePreference(pref.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        <Eye className="h-3 w-3 inline mr-1" /> Public preferences are visible to other team members
      </p>
    </div>
  );
}
