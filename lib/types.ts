// TypeScript types for the application

export interface User {
  id: number;
  username: string;
  display_name: string;
  created_at: string;
}

export interface UserStatus {
  id: number;
  user_id: number;
  location: string | null;
  location_visible: number;
  willing_to_eat: number;
  note: string | null;
  updated_at: string;
}

export interface FoodPreference {
  id: number;
  user_id: number;
  restaurant_name: string;
  priority_order: number;
  is_public: number;
  created_at: string;
}

export interface EatingRecord {
  id: number;
  restaurant_name: string;
  ate_at: string;
  created_by: number;
  participants?: User[];
}

export interface EatingParticipant {
  id: number;
  eating_record_id: number;
  user_id: number;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  username?: string;
  display_name?: string;
  message: string;
  sent_at: string;
}

export interface SessionUser {
  id: number;
  username: string;
  display_name: string;
}

export interface UserWithStatus extends User {
  status?: UserStatus;
  preferences?: FoodPreference[];
}

export type WillingStatus = 0 | 1 | 2; // 0=no, 1=yes, 2=maybe
