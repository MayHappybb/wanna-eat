import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { FoodPreference } from '@/lib/types';

initDatabase();

// Get user's preferences
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = db.prepare(
      'SELECT * FROM food_preferences WHERE user_id = ? ORDER BY priority_order'
    ).all(session.user.id) as FoodPreference[];

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add new preference
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurant_name, priority_order, is_public } = body;

    if (!restaurant_name) {
      return NextResponse.json({ error: 'Restaurant name required' }, { status: 400 });
    }

    // Get max priority order
    const maxOrder = db.prepare(
      'SELECT MAX(priority_order) as max_order FROM food_preferences WHERE user_id = ?'
    ).get(session.user.id) as { max_order: number | null };

    const order = priority_order !== undefined ? priority_order : (maxOrder.max_order ?? -1) + 1;

    const result = db.prepare(
      'INSERT INTO food_preferences (user_id, restaurant_name, priority_order, is_public) VALUES (?, ?, ?, ?)'
    ).run(session.user.id, restaurant_name, order, is_public !== false ? 1 : 0);

    const preference = db.prepare(
      'SELECT * FROM food_preferences WHERE id = ?'
    ).get(result.lastInsertRowid);

    return NextResponse.json(preference);
  } catch (error) {
    console.error('Add preference error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
