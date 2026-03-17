import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { UserStatus } from '@/lib/types';

initDatabase();

// Get current user's status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = db.prepare(
      'SELECT * FROM user_statuses WHERE user_id = ?'
    ).get(session.user.id) as UserStatus | undefined;

    if (!status) {
      // Create default status if none exists
      db.prepare(
        'INSERT INTO user_statuses (user_id, location, location_visible, willing_to_eat, note) VALUES (?, ?, ?, ?, ?)'
      ).run(session.user.id, null, 1, 0, null);

      const newStatus = db.prepare(
        'SELECT * FROM user_statuses WHERE user_id = ?'
      ).get(session.user.id) as UserStatus;

      return NextResponse.json(newStatus);
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user's status
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { location, location_visible, willing_to_eat, note } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (location_visible !== undefined) {
      updates.push('location_visible = ?');
      values.push(location_visible ? 1 : 0);
    }
    if (willing_to_eat !== undefined) {
      updates.push('willing_to_eat = ?');
      values.push(willing_to_eat);
    }
    if (note !== undefined) {
      updates.push('note = ?');
      values.push(note);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(session.user.id);

    db.prepare(
      `UPDATE user_statuses SET ${updates.join(', ')} WHERE user_id = ?`
    ).run(...values);

    // Get updated status
    const status = db.prepare(
      'SELECT * FROM user_statuses WHERE user_id = ?'
    ).get(session.user.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
