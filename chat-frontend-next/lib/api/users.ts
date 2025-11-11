/**
 * User API Service
 *
 * Provides functions to interact with user-related endpoints.
 * Handles user search, listing available users, and user profiles.
 */

import api from '../api';
import type { User } from '../types';

/**
 * Get all users (with optional search)
 *
 * @param search - Optional search query to filter users by username or email
 * @returns Promise with array of users
 *
 * @example
 * ```typescript
 * // Get all users
 * const users = await getUsers();
 *
 * // Search for users
 * const results = await getUsers('john');
 * ```
 */
export async function getUsers(search?: string): Promise<User[]> {
  const params = search ? { search } : {};
  const response = await api.get<{ data: User[], message: string }>('/v1/users', { params });
  return response.data.data;
}

/**
 * Get available users for creating direct messages
 * Returns users that the current user can start a conversation with
 *
 * @returns Promise with array of available users
 *
 * @example
 * ```typescript
 * const availableUsers = await getAvailableUsers();
 * ```
 */
export async function getAvailableUsers(): Promise<User[]> {
  const response = await api.get<{ data: User[], message: string }>('/v1/users/available');
  return response.data.data;
}

/**
 * Get user by ID
 *
 * @param userId - ID of the user to fetch
 * @returns Promise with user details
 *
 * @example
 * ```typescript
 * const user = await getUserById(123);
 * ```
 */
export async function getUserById(userId: number): Promise<User> {
  const response = await api.get<{ data: User, message: string }>(`/v1/users/${userId}`);
  return response.data.data;
}
