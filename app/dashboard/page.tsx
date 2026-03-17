'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import StatusCard from '@/components/StatusCard';
import StatusForm from '@/components/StatusForm';
import ChatBox from '@/components/ChatBox';
import EatingSummary from '@/components/EatingSummary';
import PreferenceList from '@/components/PreferenceList';
import { UserWithStatus, UserStatus } from '@/lib/types';

export default function DashboardPage() {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setCurrentUser(data.currentUser);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Setup Socket.io for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', {
        userId: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
      });
    });

    socket.on('user_status_changed', (data: { user_id: number; status: UserStatus }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === data.user_id ? { ...user, status: data.status } : user
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  function handleStatusUpdate(status: UserStatus) {
    // Refresh users list to get updated data
    fetchUsers();
  }

  const currentUserData = users.find((u) => u.username === currentUser?.username);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Section */}
        <div className="mb-8">
          <EatingSummary users={users} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Team Status */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Team Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.map((user) => (
                <StatusCard
                  key={user.id}
                  user={user}
                  isCurrentUser={user.username === currentUser?.username}
                />
              ))}
            </div>

            {/* Status Form */}
            <div className="mt-8">
              <StatusForm onStatusUpdate={handleStatusUpdate} />
            </div>
          </div>

          {/* Right Column - Chat & Preferences */}
          <div className="space-y-6">
            <ChatBox currentUser={currentUser} />
            <PreferenceList />
          </div>
        </div>
      </div>
    </div>
  );
}
