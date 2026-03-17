import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { hashPassword, getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// Initialize database on first request
initDatabase();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, display_name } = body;

    if (!username || !password || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const result = db.prepare(
      'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
    ).run(username, passwordHash, display_name);

    const userId = result.lastInsertRowid;

    // Create initial status for user
    db.prepare(
      'INSERT INTO user_statuses (user_id, location, location_visible, willing_to_eat, note) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, null, 1, 0, null);

    // Set session
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    session.user = {
      id: Number(userId),
      username,
      display_name,
    };
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
