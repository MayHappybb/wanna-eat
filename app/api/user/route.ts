import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

initDatabase();

// Get current user info
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = db.prepare(
      'SELECT id, username, display_name, created_at FROM users WHERE id = ?'
    ).get(session.user.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update username
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || username.trim() === '') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();

    // Check if username is already taken by another user
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ?'
    ).get(trimmedUsername, session.user.id);

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Update username
    db.prepare(
      'UPDATE users SET username = ? WHERE id = ?'
    ).run(trimmedUsername, session.user.id);

    // Update session
    session.user.username = trimmedUsername;
    await session.save();

    return NextResponse.json({ success: true, username: trimmedUsername });
  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
