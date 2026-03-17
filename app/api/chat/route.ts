import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { ChatMessage } from '@/lib/types';

initDatabase();

// Get recent chat messages (with pagination support)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination params from query string
    const url = new URL(request.url);
    const beforeId = url.searchParams.get('before');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let messages;
    if (beforeId) {
      // Get messages before a specific ID (for loading older messages)
      messages = db.prepare(
        `SELECT cm.*, u.username, u.display_name
         FROM chat_messages cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.id < ?
         ORDER BY cm.sent_at DESC
         LIMIT ?`
      ).all(parseInt(beforeId), limit) as (ChatMessage & { username: string; display_name: string })[];
    } else {
      // Get most recent messages (default behavior)
      messages = db.prepare(
        `SELECT cm.*, u.username, u.display_name
         FROM chat_messages cm
         JOIN users u ON cm.user_id = u.id
         ORDER BY cm.sent_at DESC
         LIMIT ?`
      ).all(limit) as (ChatMessage & { username: string; display_name: string })[];
    }

    // Reverse to get oldest first
    const orderedMessages = messages.reverse();

    return NextResponse.json(orderedMessages);
  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send chat message (also used by Socket.io, but provided for fallback)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)'
    ).run(session.user.id, message.trim());

    const newMessage = db.prepare(
      `SELECT cm.*, u.username, u.display_name
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.id = ?`
    ).get(result.lastInsertRowid);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
