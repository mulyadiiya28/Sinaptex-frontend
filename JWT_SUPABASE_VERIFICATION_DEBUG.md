# JWT Supabase Verification & Profile Registration Debugging

## Problem Summary
> Server belum menyimpan User/Profile. Cek token JWT Supabase di backend (verifySupabaseToken) dan response POST /auth/register.

The frontend successfully sends the registration request, but the backend isn't:
1. Verifying the JWT token correctly, OR
2. Creating/Saving User + Profile records, OR
3. Returning the correct response format

---

## 📤 Frontend Flow (What's Being Sent)

### 1. JWT Token Passing
**File:** [src/lib/api-client.ts](src/lib/api-client.ts#L83-L90)

The frontend sends JWT as:
```
Authorization: Bearer <supabase_access_token>
```

**Token Source:** [src/lib/supabase-client.ts](src/lib/supabase-client.ts#L58-L63)
```typescript
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
```

### 2. Registration Request
**File:** [src/app/register/page.tsx](src/app/register/page.tsx#L128-L175)

POST body example:
```json
{
  "fullName": "John Doe",
  "phone": "081234567890"
}
```

Endpoint: `POST /api/v1/auth/register`

### 3. API Client Implementation
**File:** [src/lib/api-client.ts](src/lib/api-client.ts#L83-L105)

```typescript
async function requestRaw<T>(path: string, options: FetchOptions = {}): Promise<...> {
  const { params, auth = true, headers, signal, ...init } = options;

  const authHeaders: Record<string, string> = {};

  if (auth) {
    try {
      const token = await getAccessToken();
      if (token) authHeaders.Authorization = `Bearer ${token}`;
    } catch {
      // ignore token fetch error if offline
    }
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      ...init,
      signal: fetchSignal,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,  // ← JWT Goes Here
        ...headers,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    throw new Error(`Koneksi ke backend engine gagal: ${errorMsg}`);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? message;
    } catch {}
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  return res.json();
}
```

**Base URL:** [src/lib/api-client.ts](src/lib/api-client.ts#L10-L28)
- Default: `https://cahayaastera.com` (live backend)
- Env var: `NEXT_PUBLIC_API_URL` (configurable)

---

## 🔍 Backend Verification Checklist

### Step 1: Verify JWT Token is Being Received
On backend, check if `Authorization` header exists:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Implement verifySupabaseToken
Backend MUST:
1. Extract token from `Authorization: Bearer <token>`
2. Verify token using Supabase JWT secret
3. Extract user ID from token claims (`sub` field)
4. Validate token signature & expiration

**Typical Implementation (Node.js):**
```javascript
import { jwtVerify } from 'jose';

async function verifySupabaseToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
    const verified = await jwtVerify(token, secret);
    return verified.payload; // { sub: "user-id", email: "...", ... }
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}
```

### Step 3: Create User + Profile Records
After verification succeeds:

```javascript
// 1. Extract user ID from JWT
const userId = decodedToken.sub;
const email = decodedToken.email;

// 2. Create User record (if using separate User table)
const user = await db.user.create({
  id: userId,
  email: email,
  // other fields
});

// 3. Create Profile record
const profile = await db.profile.create({
  userId: userId,         // Foreign key to User
  fullName: input.fullName,
  phone: input.phone || null,
  email: email,           // Denormalize for convenience
  // other fields
});

// 4. RETURN COMPLETE PROFILE (this is critical!)
return {
  id: profile.id || userId,
  email: profile.email,
  fullName: profile.fullName,
  phone: profile.phone,
  // ... all fields from Me interface
};
```

### Step 4: Expected Response Format
**File:** [src/features/auth/auth.schema.ts](src/features/auth/auth.schema.ts#L20-L38)

Frontend expects one of these shapes:

**Option A: Flat Me Response**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phone": "081234567890",
  "bio": null,
  "location": null,
  "isVerified": false,
  "avatarUrl": null,
  "accountStatus": "active"
}
```

**Option B: User + Profile Envelope**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "profile": {
    "id": "profile-uuid",
    "fullName": "John Doe",
    "phone": "081234567890"
  }
}
```

**Option C: API Envelope Wrapper**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "081234567890"
  }
}
```

---

## 🐛 Debugging Steps (Backend Side)

### Check 1: Is JWT Token Received?
```javascript
app.post('/api/v1/auth/register', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('[DEBUG] Authorization header:', authHeader ? '✓ Present' : '✗ Missing');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  console.log('[DEBUG] Token extracted:', token.substring(0, 20) + '...');
});
```

### Check 2: JWT Verification Failing?
```javascript
try {
  const decoded = await verifySupabaseToken(token);
  console.log('[DEBUG] JWT verification ✓ Success:', {
    userId: decoded.sub,
    email: decoded.email,
    iat: new Date(decoded.iat * 1000),
    exp: new Date(decoded.exp * 1000)
  });
} catch (error) {
  console.error('[DEBUG] JWT verification ✗ Failed:', error.message);
  return res.status(401).json({ error: error.message });
}
```

### Check 3: User/Profile Creation Failing?
```javascript
try {
  const user = await db.user.create({ /* ... */ });
  console.log('[DEBUG] User created ✓:', user.id);
  
  const profile = await db.profile.create({ /* ... */ });
  console.log('[DEBUG] Profile created ✓:', profile.id);
} catch (error) {
  console.error('[DEBUG] Database creation ✗ Failed:', error.message);
  // Log the full error for constraint violations, etc.
  return res.status(500).json({ error: error.message });
}
```

### Check 4: Response Missing Required Fields?
```javascript
// Frontend needs AT LEAST these fields:
const requiredFields = ['id', 'email', 'fullName'];

requiredFields.forEach(field => {
  if (!(field in responseData)) {
    console.warn(`[DEBUG] Response missing field: "${field}"`);
  }
});

return res.json({
  success: true,
  message: 'User registered successfully',
  data: responseData  // Must include id, email, fullName
});
```

---

## 🔗 Frontend Verification Flow

**File:** [src/features/auth/auth.api.ts](src/features/auth/auth.api.ts#L55-L90)

Frontend does this after register:
```typescript
const raw = await apiClient.post<unknown>("/api/v1/auth/register", input);
const fromRegister = normalizeMe(raw);  // Try to extract profile

// Verify by calling GET /auth/me (must return same profile)
try {
  await new Promise((r) => setTimeout(r, 300)); // Wait 300ms for DB write
  const meRaw = await apiClient.get<unknown>("/api/v1/auth/me");
  const me = normalizeMe(meRaw);
  if (me?.id) return me;  // ✓ Success
} catch (err) {
  // If this fails but register returned profile, use that
  if (fromRegister?.id) return fromRegister;
  
  // ✗ Otherwise throw error with hint to check backend
  throw new Error(
    "Server belum menyimpan User/Profile. Cek token JWT Supabase di backend..."
  );
}
```

---

## 📋 Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **JWT Secret Mismatch** | Token verification throws "signature verification failed" | Ensure `SUPABASE_JWT_SECRET` in backend matches your Supabase project |
| **Token Expired** | "JWT expired" error | Check that token freshness; Supabase tokens expire in ~1 hour |
| **Missing Authorization Header** | 401/403 errors | Verify frontend is sending `Authorization: Bearer <token>` |
| **User Already Exists** | Unique constraint violation on user.id | Check if user or profile already created in DB |
| **Missing DB Fields** | Response doesn't include `id` or `fullName` | Ensure all required fields are populated before returning |
| **Database Connection Down** | "Connection timeout" in backend logs | Check DB connection string & network connectivity |

---

## 🚀 Testing Checklist

### From Frontend DevTools (Network Tab)
1. Open registration page or form
2. Fill in email, password, full name, phone
3. Click "Selesaikan Pendaftaran" button
4. Find POST request to `/api/v1/auth/register`
5. Check:
   - ✓ Request has `Authorization: Bearer ...` header
   - ✓ Request body has `{ fullName, phone }`
   - ✓ Response status is 200/201 (not 401/403/500)
   - ✓ Response body contains `id` and `fullName` fields
   - ✓ Follow-up GET `/api/v1/auth/me` also succeeds with same user ID

### From Backend Server Logs
Enable detailed logging:
```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    const token = req.headers.authorization.substring(7, 35);
    console.log(`  Auth: Bearer ${token}...`);
  }
  next();
});
```

Then check logs when registering:
```
[2024-09-08T10:30:45Z] POST /api/v1/auth/register
  Auth: Bearer eyJhbGciOiJIUzI1NiIsInR...
[DEBUG] JWT verification ✓ Success: userId=uuid...
[DEBUG] User created ✓: uuid...
[DEBUG] Profile created ✓: uuid...
[Response] 200 OK { id, email, fullName, ... }
```

---

## 📝 Summary

**The chain must work end-to-end:**

```
Frontend sends JWT Token
        ↓
Backend receives & verifies JWT
        ↓
Backend creates User record
        ↓
Backend creates Profile record
        ↓
Backend returns complete Profile (with id, email, fullName)
        ↓
Frontend receives & parses response
        ↓
Calls GET /api/v1/auth/me to verify
        ↓
✓ Success: User logged in & redirected to /dashboard
```

If any step fails, the error message points to this file to debug.
