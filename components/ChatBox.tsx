'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import { io, Socket } from 'socket.io-client';

interface ChatBoxProps {
  currentUser: { id: number; username: string; display_name: string } | null;
}

export default function ChatBox({ currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    fetch('/api/chat')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      })
      .catch(() => setMessages([]));
  }, []);

  // Setup Socket.io
  useEffect(() => {
    if (!currentUser) return;

    const socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('authenticate', {
        userId: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new_message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('online_users', (data: { users: number[] }) => {
      setOnlineUsers(data.users);
    });

    socket.on('user_online', (data: { user_id: number }) => {
      setOnlineUsers((prev) => [...new Set([...prev, data.user_id])]);
    });

    socket.on('user_offline', (data: { user_id: number }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.user_id));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit('message', { message: input.trim() });
    setInput('');
  }

  function formatTime(dateString: string) {
    // Handle SQLite datetime format (YYYY-MM-DD HH:MM:SS) which is in UTC
    // by appending 'Z' to treat it as UTC, then convert to local time
    let date: Date;
    if (dateString.includes(' ') && !dateString.includes('T') && !dateString.endsWith('Z')) {
      // SQLite format: treat as UTC by adding Z
      date = new Date(dateString.replace(' ', 'T') + 'Z');
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Team Chat</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{onlineUsers.length} online</span>
          <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!Array.isArray(messages) || messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.user_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-medium opacity-75 mb-0.5">{msg.display_name}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                </div>
                <span className="text-xs text-gray-400 mt-1">{formatTime(msg.sent_at)}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || !connected}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
