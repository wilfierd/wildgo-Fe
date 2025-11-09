/**
 * Authentication API Service
 *
 * This module provides authentication-related API calls to the backend.
 * All endpoints are prefixed with /api/auth
 *
 * Available endpoints:
 * - POST /api/auth/register - Register a new user
 * - POST /api/auth/login - Login with email/password
 * - GET /api/auth/profile - Get current user profile
 * - POST /api/auth/refresh - Refresh JWT token
 * - POST /api/auth/github/device/start - Start GitHub device flow
 * - POST /api/auth/github/device/poll - Poll GitHub device flow
 */

import api from '../api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

/**
 * Register a new user account
 *
 * @param data - User registration data
 * @returns Promise with authentication token and user data
 *
 * @example
 * ```ts
 * const result = await register({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   password: 'securepass123',
 *   role: 'user' // optional
 * });
 * ```
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
}

/**
 * Login with email and password
 *
 * @param credentials - Login credentials
 * @returns Promise with authentication token and user data
 *
 * @example
 * ```ts
 * const result = await login({
 *   email: 'john@example.com',
 *   password: 'securepass123'
 * });
 * ```
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Get current authenticated user's profile
 * Requires valid JWT token in localStorage
 *
 * @returns Promise with user profile data
 *
 * @example
 * ```ts
 * const user = await getProfile();
 * console.log(user.username, user.email);
 * ```
 */
export async function getProfile(): Promise<User> {
  const response = await api.get<User>('/auth/profile');
  return response.data;
}

/**
 * Refresh the current JWT token
 * Useful for extending session without re-login
 *
 * @returns Promise with new JWT token
 *
 * @example
 * ```ts
 * const { token } = await refreshToken();
 * localStorage.setItem('token', token);
 * ```
 */
export async function refreshToken(): Promise<{ token: string }> {
  const response = await api.post<{ token: string }>('/auth/refresh');
  return response.data;
}

/**
 * GitHub Device Flow Types
 */
export interface GitHubDeviceStartResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface GitHubDevicePollRequest {
  device_code: string;
}

export interface GitHubDevicePollResponse {
  status: 'pending' | 'authorized' | 'expired' | 'error';
  token?: string;
  user?: User;
  message?: string;
}

/**
 * Start GitHub device flow authentication
 * Used for CLI and devices without a browser
 *
 * @returns Promise with device code and verification URL
 *
 * @example
 * ```ts
 * const { user_code, verification_uri } = await startGitHubDeviceFlow();
 * console.log(`Go to ${verification_uri} and enter code: ${user_code}`);
 * ```
 */
export async function startGitHubDeviceFlow(): Promise<GitHubDeviceStartResponse> {
  const response = await api.post<GitHubDeviceStartResponse>('/auth/github/device/start');
  return response.data;
}

/**
 * Poll GitHub device flow for authorization
 * Should be called repeatedly until user authorizes
 *
 * @param deviceCode - Device code from startGitHubDeviceFlow
 * @returns Promise with poll status and auth data if authorized
 *
 * @example
 * ```ts
 * const poll = async (deviceCode: string) => {
 *   const result = await pollGitHubDeviceFlow(deviceCode);
 *   if (result.status === 'authorized') {
 *     localStorage.setItem('token', result.token!);
 *   }
 *   return result;
 * };
 * ```
 */
export async function pollGitHubDeviceFlow(deviceCode: string): Promise<GitHubDevicePollResponse> {
  const response = await api.post<GitHubDevicePollResponse>('/auth/github/device/poll', {
    device_code: deviceCode
  });
  return response.data;
}
