import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  session.destroy();
  return NextResponse.json({ success: true });
}
