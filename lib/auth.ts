import { getIronSession, IronSession } from 'iron-session';
import { SessionUser } from './types';
import bcrypt from 'bcryptjs';

export const sessionOptions = {
  cookieName: 'wanna_eat_session',
  password: process.env.SESSION_SECRET || 'default_secret_change_in_production',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export interface SessionData {
  user?: SessionUser;
}

export type TypedSession = IronSession<SessionData>;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSession(cookieStore: any): Promise<TypedSession> {
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
