import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// Update preference
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const preferenceId = parseInt(id);
    const body = await request.json();
    const { priority_order, is_public } = body;

    // Verify ownership
    const preference = db.prepare(
      'SELECT user_id FROM food_preferences WHERE id = ?'
    ).get(preferenceId) as { user_id: number } | undefined;

    if (!preference || preference.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (number | string)[] = [];

    if (priority_order !== undefined) {
      updates.push('priority_order = ?');
      values.push(priority_order);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      values.push(is_public ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(
        `UPDATE food_preferences SET ${updates.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    const updated = db.prepare('SELECT * FROM food_preferences WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update preference error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete preference
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const preferenceId = parseInt(id);

    // Verify ownership
    const preference = db.prepare(
      'SELECT user_id FROM food_preferences WHERE id = ?'
    ).get(preferenceId) as { user_id: number } | undefined;

    if (!preference || preference.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM food_preferences WHERE id = ?').run(preferenceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete preference error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
