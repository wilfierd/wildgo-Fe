/**
 * API Service Modules
 *
 * Central export point for all API services.
 * Import specific services as needed:
 *
 * @example
 * ```ts
 * import { auth, rooms } from '@/lib/api';
 * const user = await auth.getProfile();
 * const allRooms = await rooms.getRooms();
 * ```
 *
 * Or import specific functions:
 * ```ts
 * import { login, register } from '@/lib/api/auth';
 * import { getRooms, createDirectRoom } from '@/lib/api/rooms';
 * ```
 */

import * as auth from './auth';
import * as rooms from './rooms';

export { auth, rooms };

// Re-export for convenience
export * from './auth';
export * from './rooms';
