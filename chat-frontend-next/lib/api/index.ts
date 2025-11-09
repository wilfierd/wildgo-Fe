/**
 * API Service Modules
 *
 * Central export point for all API services.
 * Import specific services as needed:
 *
 * @example
 * ```ts
 * import { auth } from '@/lib/api';
 * const user = await auth.getProfile();
 * ```
 *
 * Or import specific functions:
 * ```ts
 * import { login, register } from '@/lib/api/auth';
 * ```
 */

import * as auth from './auth';

export { auth };

// Re-export for convenience
export * from './auth';
