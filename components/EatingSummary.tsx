'use client';

import { UserWithStatus, FoodPreference } from '@/lib/types';
import { Users, MapPin, Utensils, TrendingUp } from 'lucide-react';

interface EatingSummaryProps {
  users: UserWithStatus[];
}

export default function EatingSummary({ users }: EatingSummaryProps) {
  // Filter users willing to eat
  const willingUsers = users.filter(
    (user) => user.status?.willing_to_eat === 1
  );

  // Calculate popular restaurants
  const restaurantScores = new Map<string, number>();
  const restaurantVoters = new Map<string, { name: string; count: number }[]>();

  willingUsers.forEach((user) => {
    user.preferences?.forEach((pref) => {
      const score = 1 / (pref.priority_order + 1);
      const currentScore = restaurantScores.get(pref.restaurant_name) || 0;
      restaurantScores.set(pref.restaurant_name, currentScore + score);

      // Track voters
      const voters = restaurantVoters.get(pref.restaurant_name) || [];
      voters.push({ name: user.display_name, count: pref.priority_order + 1 });
      restaurantVoters.set(pref.restaurant_name, voters);
    });
  });

  // Sort restaurants by score
  const sortedRestaurants = Array.from(restaurantScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Get location distribution
  const locationCounts = new Map<string, number>();
  willingUsers.forEach((user) => {
    if (user.status?.location && user.status?.location_visible) {
      const loc = user.status.location;
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    }
  });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
          <Utensils className="h-5 w-5 text-blue-600" />
          <span>Eating Summary</span>
        </h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {willingUsers.length} hungry
        </span>
      </div>

      {willingUsers.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Nobody is hungry yet</p>
          <p className="text-sm">Be the first to say you wanna eat!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Popular restaurants */}
          {sortedRestaurants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>Top Recommendations</span>
              </h3>
              <div className="space-y-2">
                {sortedRestaurants.map(([name, score], index) => (
                  <div
                    key={name}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      index === 0 ? 'bg-green-50 border border-green-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(restaurantVoters.get(name) || []).length} votes
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Who's eating */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Who&apos;s Eating</h3>
            <div className="flex flex-wrap gap-2">
              {willingUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-700"
                >
                  {user.display_name}
                </span>
              ))}
            </div>
          </div>

          {/* Locations */}
          {locationCounts.size > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Where People Are</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(locationCounts.entries()).map(([location, count]) => (
                  <span
                    key={location}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
                  >
                    {location}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
