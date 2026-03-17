import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { verifyPassword, getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// Initialize database on first request
initDatabase();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing username or password' },
        { status: 400 }
      );
    }

    // Find user
    const user = db.prepare(
      'SELECT id, username, display_name, password_hash FROM users WHERE username = ?'
    ).get(username) as { id: number; username: string; display_name: string; password_hash: string } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set session
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    session.user = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
    };
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
