'use client';

import { useState, useEffect } from 'react';
import { UserStatus } from '@/lib/types';
import { MapPin, Eye, EyeOff, Utensils, Clock, HelpCircle, Save } from 'lucide-react';

const locationPresets = [
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'office', label: 'Office' },
  { value: 'out', label: 'Out' },
];

const willingOptions = [
  { value: 0, label: 'Not hungry', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  { value: 1, label: 'Wanna eat!', icon: Utensils, color: 'bg-green-100 text-green-700' },
  { value: 2, label: 'Maybe', icon: HelpCircle, color: 'bg-yellow-100 text-yellow-700' },
];

interface StatusFormProps {
  onStatusUpdate?: (status: UserStatus) => void;
}

export default function StatusForm({ onStatusUpdate }: StatusFormProps) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        // Check if location is custom
        const isPreset = locationPresets.some(p => p.value === data.location);
        if (data.location && !isPreset) {
          setCustomLocation(data.location);
          setShowCustomInput(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveStatus() {
    if (!status) return;

    setSaving(true);
    try {
      const res = await fetch('/api/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: showCustomInput ? customLocation : status.location,
          location_visible: status.location_visible,
          willing_to_eat: status.willing_to_eat,
          note: status.note,
        }),
      });

      if (res.ok) {
        const updatedStatus = await res.json();
        setStatus(updatedStatus);
        onStatusUpdate?.(updatedStatus);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Your Status</h3>

      <div className="space-y-4">
        {/* Willing to eat selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">How hungry are you?</label>
          <div className="grid grid-cols-3 gap-2">
            {willingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatus({ ...status, willing_to_eat: option.value })}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                  status.willing_to_eat === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option.icon className={`h-5 w-5 mb-1 ${option.color.split(' ')[1]}`} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <button
              onClick={() => setStatus({ ...status, location_visible: status.location_visible ? 0 : 1 })}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {status.location_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <span>{status.location_visible ? 'Visible' : 'Hidden'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {locationPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setStatus({ ...status, location: preset.value });
                  setShowCustomInput(false);
                  setCustomLocation('');
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  status.location === preset.value && !showCustomInput
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(true)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                showCustomInput ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {showCustomInput && (
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Enter custom location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
          <textarea
            value={status.note || ''}
            onChange={(e) => setStatus({ ...status, note: e.target.value })}
            placeholder="Add a note..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
          />
        </div>

        {/* Save button */}
        <button
          onClick={saveStatus}
          disabled={saving}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Update Status'}</span>
        </button>
      </div>
    </div>
  );
}
