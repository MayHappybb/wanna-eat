import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { EatingRecord, User } from '@/lib/types';

initDatabase();

// Get eating records with pagination
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get records
    const records = db.prepare(
      `SELECT er.*, u.display_name as creator_name
       FROM eating_records er
       JOIN users u ON er.created_by = u.id
       ORDER BY er.ate_at DESC
       LIMIT ? OFFSET ?`
    ).all(limit, offset) as (EatingRecord & { creator_name: string })[];

    // Get total count
    const countResult = db.prepare('SELECT COUNT(*) as total FROM eating_records').get() as { total: number };

    // Get participants for each record
    const recordsWithParticipants = records.map(record => {
      const participants = db.prepare(
        `SELECT u.id, u.username, u.display_name
         FROM eating_participants ep
         JOIN users u ON ep.user_id = u.id
         WHERE ep.eating_record_id = ?`
      ).all(record.id) as User[];

      return {
        ...record,
        participants,
      };
    });

    return NextResponse.json({
      records: recordsWithParticipants,
      total: countResult.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new eating record
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurant_name, participant_ids } = body;

    if (!restaurant_name) {
      return NextResponse.json({ error: 'Restaurant name required' }, { status: 400 });
    }

    // Create record
    const result = db.prepare(
      'INSERT INTO eating_records (restaurant_name, created_by) VALUES (?, ?)'
    ).run(restaurant_name, session.user.id);

    const recordId = result.lastInsertRowid;

    // Add participants
    const uniqueParticipantIds = [...new Set([session.user.id, ...(participant_ids || [])])];

    for (const participantId of uniqueParticipantIds) {
      db.prepare(
        'INSERT INTO eating_participants (eating_record_id, user_id) VALUES (?, ?)'
      ).run(recordId, participantId);
    }

    // Reset all users' "wanna eat" status to "Not hungry" (keep location and note)
    db.prepare(
      `UPDATE user_statuses
       SET willing_to_eat = 0, updated_at = CURRENT_TIMESTAMP`
    ).run();

    const record = db.prepare('SELECT * FROM eating_records WHERE id = ?').get(recordId);

    return NextResponse.json(record);
  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
