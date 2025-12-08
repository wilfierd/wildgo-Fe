// Shared type definitions for the chat application

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  bio?: string;
  // Social login fields
  provider?: string;
  github_id?: string;
  avatar_url?: string;
  // Activity tracking
  last_active_at?: string | null;
  is_online?: boolean;
  status?: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  content: string;
  user_id: number;
  user: User;
  room_id: number;
  parent_id?: number;
  parent_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}
