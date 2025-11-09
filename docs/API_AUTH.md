# Authentication API Documentation

## Overview

This document describes all authentication-related API endpoints available in the WindGo Chat application. All authentication endpoints are prefixed with `/api/auth`.

**Base URL:** `http://localhost:8080/api/auth`

---

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
  - [Register](#register)
  - [Login](#login)
  - [Get Profile](#get-profile)
  - [Refresh Token](#refresh-token)
- [GitHub OAuth (Device Flow)](#github-oauth-device-flow)
  - [Start Device Flow](#start-device-flow)
  - [Poll Device Flow](#poll-device-flow)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Authentication Endpoints

### Register

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, 'admin' or 'user', default: 'user')"
}
```

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `409 Conflict` - User with email/username already exists
- `500 Internal Server Error` - Server error

**TypeScript Usage:**
```typescript
import { register } from '@/lib/api/auth';

const result = await register({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'securepass123',
  role: 'user'
});
```

---

### Login

Authenticate a user with email and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

**TypeScript Usage:**
```typescript
import { login } from '@/lib/api/auth';

const result = await login({
  email: 'john@example.com',
  password: 'securepass123'
});

// Store token
localStorage.setItem('token', result.token);
```

---

### Get Profile

Get the current authenticated user's profile.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - No token or invalid token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

**TypeScript Usage:**
```typescript
import { getProfile } from '@/lib/api/auth';

const user = await getProfile();
console.log(`Welcome ${user.username}!`);
```

---

### Refresh Token

Refresh the current JWT token to extend session.

**Endpoint:** `POST /api/auth/refresh`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - No token or invalid token
- `500 Internal Server Error` - Server error

**TypeScript Usage:**
```typescript
import { refreshToken } from '@/lib/api/auth';

const { token } = await refreshToken();
localStorage.setItem('token', token);
```

---

## GitHub OAuth (Device Flow)

### Start Device Flow

Initiate GitHub OAuth device flow for CLI/device authentication.

**Endpoint:** `POST /api/auth/github/device/start`

**Request Body:** None

**Response:** `200 OK`
```json
{
  "device_code": "3584d83297c62e4a82ef8a3e9f40a3d5f",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
```

**TypeScript Usage:**
```typescript
import { startGitHubDeviceFlow } from '@/lib/api/auth';

const result = await startGitHubDeviceFlow();
console.log(`Go to ${result.verification_uri}`);
console.log(`Enter code: ${result.user_code}`);
```

---

### Poll Device Flow

Poll for GitHub device flow authorization status.

**Endpoint:** `POST /api/auth/github/device/poll`

**Request Body:**
```json
{
  "device_code": "string (required)"
}
```

**Response:** `200 OK`

**Pending:**
```json
{
  "status": "pending",
  "message": "Authorization pending"
}
```

**Authorized:**
```json
{
  "status": "authorized",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Expired:**
```json
{
  "status": "expired",
  "message": "Device code has expired"
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Error message"
}
```

**TypeScript Usage:**
```typescript
import { pollGitHubDeviceFlow } from '@/lib/api/auth';

// Poll every 5 seconds
const interval = setInterval(async () => {
  const result = await pollGitHubDeviceFlow(deviceCode);

  if (result.status === 'authorized') {
    clearInterval(interval);
    localStorage.setItem('token', result.token!);
    console.log('Logged in successfully!');
  } else if (result.status === 'expired' || result.status === 'error') {
    clearInterval(interval);
    console.error('Authentication failed:', result.message);
  }
}, 5000);
```

---

## Data Models

### User

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: string; // "admin" | "user"
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}
```

### AuthResponse

```typescript
interface AuthResponse {
  token: string; // JWT token
  user: User;
}
```

### LoginRequest

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### RegisterRequest

```typescript
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string; // Optional, defaults to "user"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

### Error Handling in TypeScript

```typescript
import { login } from '@/lib/api/auth';

try {
  const result = await login({ email, password });
  // Success
} catch (error: any) {
  if (error.code === 'ERR_NETWORK') {
    // Network error - backend not running
    console.error('Cannot connect to server');
  } else if (error.response) {
    // HTTP error response
    const status = error.response.status;
    const message = error.response.data?.error || 'Unknown error';

    switch (status) {
      case 401:
        console.error('Invalid credentials');
        break;
      case 400:
        console.error('Invalid input:', message);
        break;
      default:
        console.error('Error:', message);
    }
  }
}
```

---

## Usage Examples

### Complete Login Flow

```typescript
import { login } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login: setAuth } = useAuth();

  const handleLogin = async () => {
    try {
      const { token, user } = await login({ email, password });

      // Store authentication
      setAuth(token, user);

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/chat');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    }
  };

  // ... render form
}
```

### Complete Registration Flow

```typescript
import { register } from '@/lib/api/auth';

async function handleRegister(username: string, email: string, password: string) {
  try {
    const { token, user } = await register({
      username,
      email,
      password,
      role: 'user'
    });

    // Store token
    localStorage.setItem('token', token);

    // Redirect to chat
    router.push('/chat');
  } catch (error: any) {
    if (error.response?.status === 409) {
      alert('User already exists');
    } else {
      alert('Registration failed');
    }
  }
}
```

### Protected Route with Auto-Refresh

```typescript
import { getProfile, refreshToken } from '@/lib/api/auth';

async function checkAuth() {
  try {
    // Try to get profile
    const user = await getProfile();
    return user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        const { token } = await refreshToken();
        localStorage.setItem('token', token);

        // Retry getting profile
        return await getProfile();
      } catch (refreshError) {
        // Refresh failed, redirect to login
        router.push('/login');
        return null;
      }
    }
    throw error;
  }
}
```

---

## Implementation Status

✅ **Fully Implemented:**
- Register endpoint
- Login endpoint
- Get Profile endpoint
- Refresh Token endpoint
- GitHub Device Flow (Start)
- GitHub Device Flow (Poll)

✅ **Frontend Integration:**
- Auth API service layer (`lib/api/auth.ts`)
- useAuth hook with auto token validation
- LoginForm component using auth API
- Error handling for network and HTTP errors

🔜 **Future Enhancements:**
- Registration UI component
- GitHub OAuth web flow UI
- Password reset flow
- Email verification

---

## Testing

### Demo Accounts

The backend is seeded with demo accounts for testing:

**Admin Account:**
- Email: `admin@windgo.com`
- Password: `admin123`

**User Accounts:**
- Email: `demo@windgo.com` / Password: `admin123`
- Email: `test@windgo.com` / Password: `test123`

### Test the API

```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Profile (replace TOKEN with actual JWT)
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Refresh Token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Authorization: Bearer TOKEN"
```

---

## Notes

- All JWT tokens are stored in `localStorage` with key `'token'`
- Tokens are automatically added to requests via axios interceptor in `lib/api.ts`
- Password must be at least 6 characters
- Email must be a valid email format
- Username and email must be unique
- Tokens should be refreshed before expiration for seamless UX
