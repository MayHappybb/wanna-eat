import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import db from './db';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

let io: SocketIOServer | undefined;

export function getIO() {
  return io;
}

export function initSocket(server: NetServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const onlineUsers = new Map<string, { userId: number; username: string }>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // User authentication via socket
    socket.on('authenticate', (data: { userId: number; username: string; display_name: string }) => {
      socket.data.user = data;
      onlineUsers.set(socket.id, { userId: data.userId, username: data.username });

      // Broadcast user online
      socket.broadcast.emit('user_online', { user_id: data.userId, username: data.username });

      // Send online users list to new user
      const onlineList = Array.from(onlineUsers.values()).map(u => u.userId);
      socket.emit('online_users', { users: [...new Set(onlineList)] });
    });

    // Handle chat messages
    socket.on('message', async (data: { message: string }) => {
      if (!socket.data.user) return;

      const { userId, username, display_name } = socket.data.user;
      const message = data.message.trim();

      if (!message) return;

      // Save to database
      try {
        const result = db.prepare(
          'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)'
        ).run(userId, message);

        const messageData = {
          id: Number(result.lastInsertRowid),
          user_id: userId,
          username,
          display_name,
          message,
          sent_at: new Date().toISOString(),
        };

        // Broadcast to all clients
        io?.emit('new_message', messageData);
      } catch (err) {
        console.error('Failed to save message:', err);
      }
    });

    // Handle status updates
    socket.on('status_update', async (data: { location?: string; location_visible?: boolean; willing_to_eat?: number; note?: string }) => {
      if (!socket.data.user) return;

      const { userId } = socket.data.user;

      try {
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (data.location !== undefined) {
          updates.push('location = ?');
          values.push(data.location);
        }
        if (data.location_visible !== undefined) {
          updates.push('location_visible = ?');
          values.push(data.location_visible ? 1 : 0);
        }
        if (data.willing_to_eat !== undefined) {
          updates.push('willing_to_eat = ?');
          values.push(data.willing_to_eat);
        }
        if (data.note !== undefined) {
          updates.push('note = ?');
          values.push(data.note);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        db.prepare(
          `UPDATE user_statuses SET ${updates.join(', ')} WHERE user_id = ?`
        ).run(...values);

        // Get updated status
        const status = db.prepare(
          'SELECT * FROM user_statuses WHERE user_id = ?'
        ).get(userId);

        // Broadcast to all clients
        io?.emit('user_status_changed', { user_id: userId, status });
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        onlineUsers.delete(socket.id);
        // Check if user still has other connections
        const stillOnline = onlineUsers.values().some(u => u.userId === user.userId);
        if (!stillOnline) {
          io?.emit('user_offline', { user_id: user.userId });
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
