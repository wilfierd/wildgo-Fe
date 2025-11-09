"use client";
import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/api/auth';
import { User } from '@/lib/types';

/**
 * Custom React hook for authentication state management
 *
 * Handles:
 * - User authentication state
 * - Loading states during auth operations
 * - User profile data
 * - Login/logout operations
 * - Automatic token validation on mount
 *
 * @returns Authentication state and methods
 *
 * @example
 * ```tsx
 * const { isAuthenticated, loading, user, login, logout } = useAuth();
 *
 * if (loading) return <div>Loading...</div>;
 * if (!isAuthenticated) return <LoginForm />;
 * return <div>Welcome {user?.username}</div>;
 * ```
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user profile to get user info including role
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch user profile from backend using stored JWT token
   * Called automatically on mount if token exists
   */
  const fetchUserProfile = async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Token might be invalid or expired
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user with JWT token and optional user data
   *
   * @param token - JWT authentication token
   * @param userData - Optional user data (if not provided, will fetch from server)
   *
   * @example
   * ```ts
   * const { token, user } = await loginAPI({ email, password });
   * login(token, user);
   * ```
   */
  const login = (token: string, userData?: User) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);
    } else {
      // Fetch user profile if not provided
      fetchUserProfile();
    }
  };

  /**
   * Logout current user
   * Clears token from localStorage and resets auth state
   *
   * @example
   * ```ts
   * logout();
   * router.push('/login');
   * ```
   */
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
    // Expose refetch method for manual profile updates
    refetchProfile: fetchUserProfile
  };
}; 