/**
 * API Service Modules
 *
 * Central export point for all API services.
 * Import specific services as needed:
 *
 * @example
 * ```ts
 * import { auth, rooms, messages } from '@/lib/api';
 * const user = await auth.getProfile();
 * const allRooms = await rooms.getRooms();
 * const roomMessages = await messages.getMessages(1);
 * ```
 *
 * Or import specific functions:
 * ```ts
 * import { login, register } from '@/lib/api/auth';
 * import { getRooms, createDirectRoom } from '@/lib/api/rooms';
 * import { sendMessage, getMessages } from '@/lib/api/messages';
 * ```
 */

import * as auth from './auth';
import * as rooms from './rooms';
import * as messages from './messages';
import * as users from './users';

export { auth, rooms, messages, users };

// Re-export for convenience
export * from './auth';
export * from './rooms';
export * from './messages';
export * from './users';
