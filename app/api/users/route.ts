import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { UserWithStatus, FoodPreference } from '@/lib/types';

initDatabase();

// Get all users with their status and public preferences
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users
    const users = db.prepare(
      'SELECT id, username, display_name, created_at FROM users'
    ).all() as UserWithStatus[];

    // Get statuses
    const statuses = db.prepare(
      'SELECT * FROM user_statuses'
    ).all() as { user_id: number; location: string | null; location_visible: number; willing_to_eat: number; note: string | null; updated_at: string }[];

    // Get public preferences for all users
    const preferences = db.prepare(
      'SELECT * FROM food_preferences WHERE is_public = 1 ORDER BY user_id, priority_order'
    ).all() as FoodPreference[];

    // Merge data
    const usersWithData = users.map(user => {
      const userStatus = statuses.find(s => s.user_id === user.id);
      const userPreferences = preferences.filter(p => p.user_id === user.id);

      return {
        ...user,
        status: userStatus ? {
          ...userStatus,
          location: userStatus.location_visible ? userStatus.location : null,
          location_visible: userStatus.location_visible,
        } : null,
        preferences: userPreferences,
      };
    });

    return NextResponse.json({
      users: usersWithData,
      currentUser: {
        id: session.user.id,
        username: session.user.username,
        display_name: session.user.display_name,
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
