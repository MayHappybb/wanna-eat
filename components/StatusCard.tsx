'use client';

import { UserWithStatus } from '@/lib/types';
import { MapPin, Clock, Utensils, HelpCircle } from 'lucide-react';

interface StatusCardProps {
  user: UserWithStatus;
  isCurrentUser?: boolean;
}

const willingLabels: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  0: { label: 'Not hungry', color: 'bg-gray-100 text-gray-600', icon: <Clock className="h-4 w-4" /> },
  1: { label: 'Wanna eat!', color: 'bg-green-100 text-green-700', icon: <Utensils className="h-4 w-4" /> },
  2: { label: 'Maybe', color: 'bg-yellow-100 text-yellow-700', icon: <HelpCircle className="h-4 w-4" /> },
};

const locationOptions: Record<string, { label: string; color: string }> = {
  dormitory: { label: 'Dormitory', color: 'bg-purple-100 text-purple-700' },
  office: { label: 'Office', color: 'bg-blue-100 text-blue-700' },
  out: { label: 'Out', color: 'bg-orange-100 text-orange-700' },
};

export default function StatusCard({ user, isCurrentUser }: StatusCardProps) {
  const status = user.status;
  const willing = status ? willingLabels[status.willing_to_eat] : willingLabels[0];

  const getLocationDisplay = () => {
    if (!status || !status.location_visible) {
      return { label: 'Location hidden', color: 'bg-gray-100 text-gray-500' };
    }
    if (!status.location) {
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-500' };
    }
    return locationOptions[status.location] || { label: status.location, color: 'bg-gray-100 text-gray-700' };
  };

  const locationDisplay = getLocationDisplay();

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${isCurrentUser ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {user.display_name}
            {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(You)</span>}
          </h3>
        </div>
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${willing.color}`}>
          {willing.icon}
          <span>{willing.label}</span>
        </span>
      </div>

      <div className="mt-3 flex items-center space-x-2">
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs ${locationDisplay.color}`}>
          <MapPin className="h-3 w-3" />
          <span>{locationDisplay.label}</span>
        </span>
      </div>

      {status?.note && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{status.note}</p>
      )}

      {user.preferences && user.preferences.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Preferences:</p>
          <div className="flex flex-wrap gap-1">
            {user.preferences.slice(0, 3).map((pref) => (
              <span
                key={pref.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
              >
                {pref.restaurant_name}
              </span>
            ))}
            {user.preferences.length > 3 && (
              <span className="text-xs text-gray-400">+{user.preferences.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
