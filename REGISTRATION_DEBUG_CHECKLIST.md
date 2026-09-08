# Registration Debugging Checklist

## User Action Flow

```
User fills registration form:
   - Email: john@example.com
   - Password: secure123
   - Full Name: John Doe
   - Phone: 081234567890
         ↓
Click "Selesaikan Pendaftaran" button
```

---

## Frontend Sequence

### 1. Get Current Session
```typescript
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
const session = sessionData.session;
const accessToken = session?.access_token;  // JWT from Supabase
```

### 2. Validate Inputs
```typescript
const name = fullName.trim();
// ✅ Must be >= 2 chars
// ✅ Phone must be >= 8 digits or empty

const body = { fullName: name, phone: "081234567890" };
```

### 3. Send POST Request
```typescript
const profile = await authApi.register(body);
// Files: src/features/auth/auth.api.ts
// Endpoint: POST /api/v1/auth/register
// Header: Authorization: Bearer <supabase_access_token>
// Body: { fullName, phone }
```

### 4. Verify Response
```typescript
if (!profile?.id || !profile.fullName) {
  throw new Error("Backend tidak mengembalikan profil lengkap...");
}
```

### 5. Cache & Redirect
```typescript
setMe(profile);
queryClient.setQueryData(authKeys.me, profile);
router.replace("/dashboard");
```

---

## Where Errors Can Occur

### Error Point 1: No Supabase Session
```
❌ Error: "Sesi login tidak ditemukan. Silakan login ulang."
Cause: user not authenticated in Supabase
Fix: Make sure user completed signup step first
```

### Error Point 2: Invalid Input
```
❌ Error: "Nama lengkap minimal 2 karakter."
        or "Nomor telepon minimal 8 digit..."
Cause: User filled form incorrectly
Fix: User must fix their input
```

### Error Point 3: POST /auth/register Failed
```
❌ Error: "Server belum menyimpan User/Profile. Cek token JWT Supabase di 
          backend (verifySupabaseToken) dan response POST /auth/register."
Cause: Backend couldn't process the request
Check:
  1. Was JWT token sent? (see Network tab)
  2. Was JWT token valid? (check backend logs)
  3. Was User/Profile created? (check backend database)
  4. Was response valid? (check Network tab response body)
```

### Error Point 4: Backend Didn't Return Full Profile
```
❌ Error: "Backend tidak mengembalikan profil lengkap. Cek response POST 
          /auth/register di Network."
Cause: Response missing required fields
Check:
  1. Response has 'id' field
  2. Response has 'email' field
  3. Response has 'fullName' field
```

---

## Monitoring Backend Request

### Step 1: Open DevTools
- Press F12 in browser
- Click "Network" tab

### Step 2: Clear Previous Requests
- Click circular refresh icon in Network tab

### Step 3: Perform Registration
- User fills form and clicks "Selesaikan Pendaftaran"
- Watch Network tab for requests

### Step 4: Find the Register Request
- Look for request to `/api/v1/auth/register`
- Should see:
  - **Method:** POST
  - **URL:** `https://cahayaastera.com/api/v1/auth/register`
  - **Status:** 200, 201 (success) or 400, 401, 500 (error)

### Step 5: Check Request Headers
- Click the request
- Go to "Headers" tab
- Verify: `Authorization: Bearer eyJhbGc...`
  - Should see "Bearer " followed by long token
  - If missing: Frontend not sending JWT

### Step 6: Check Request Body
- Click the request  
- Go to "Request" or "Payload" tab
- Should see:
```json
{
  "fullName": "John Doe",
  "phone": "081234567890"
}
```

### Step 7: Check Response
- Click the request
- Go to "Response" tab
- Should see:
```json
{
  "success": true,
  "message": "...",
  "data": {
    "id": "uuid-xxx",
    "email": "john@example.com",
    "fullName": "John Doe",
    "phone": "081234567890"
  }
}
```

---

## Backend Server Logs Checklist

### What to Look For

#### ✅ Good Log Sequence
```
2024-09-08 10:30:45 [INFO] POST /api/v1/auth/register

2024-09-08 10:30:45 [DEBUG] Authorization header found
  Token starts with: eyJhbGciOiJIUzI1NiIsInR...

2024-09-08 10:30:45 [DEBUG] JWT verification successful
  Decoded payload: {
    sub: "uuid-123456",
    email: "john@example.com",
    aud: "authenticated",
    iss: "...",
    exp: 1725974445,
    ...
  }

2024-09-08 10:30:45 [DEBUG] Creating user record
  id: uuid-123456
  email: john@example.com

2024-09-08 10:30:45 [DEBUG] User created successfully
  userId: uuid-123456

2024-09-08 10:30:45 [DEBUG] Creating profile record
  userId: uuid-123456
  fullName: John Doe
  phone: 081234567890

2024-09-08 10:30:45 [DEBUG] Profile created successfully
  profileId: profile-uuid

2024-09-08 10:30:45 [INFO] Sending response (200 OK)
  {
    "success": true,
    "data": {
      "id": "profile-uuid",
      "email": "john@example.com",
      "fullName": "John Doe",
      "phone": "081234567890"
    }
  }

2024-09-08 10:30:45 [DEBUG] GET /api/v1/auth/me (verification)
  [200 OK] User profile returned
```

#### ❌ Problem: No Authorization Header
```
2024-09-08 10:30:45 [ERROR] Authorization header missing
  Status: 401 Unauthorized
```
**Fix:** Check frontend is sending token

#### ❌ Problem: JWT Verification Failed
```
2024-09-08 10:30:45 [ERROR] JWT verification failed
  Error: "signature verification failed"
  
OR

Error: "JWT expired"
```
**Fix:** 
- Check SUPABASE_JWT_SECRET matches your Supabase project
- Check token is not expired (should be < 1 hour old)

#### ❌ Problem: User Already Exists (Unique Constraint)
```
2024-09-08 10:30:45 [ERROR] Creating user failed
  Error: "Unique constraint violation on user.id"
  
OR

Error: "Duplicate entry for email"
```
**Fix:** 
- Check if user already exists in database
- Check if using same user ID from Supabase

#### ❌ Problem: Database Connection Error
```
2024-09-08 10:30:45 [ERROR] Database connection failed
  Error: "Connection timeout / refused"
```
**Fix:**
- Check database is running
- Check connection string in .env
- Check firewall/network connectivity

#### ❌ Problem: Missing Required Fields in Response
```
2024-09-08 10:30:45 [DEBUG] Sending response (200 OK)
  {
    "success": true,
    "data": {
      "email": "john@example.com",
      "fullName": "John Doe"
      // Missing "id" field!
    }
  }
```
**Fix:** Ensure response includes `id`, `email`, `fullName`

---

## Quick Diagnostic Steps

### Is Frontend Sending JWT?
```bash
# DevTools → Network → POST /auth/register → Headers tab
# Look for request header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Is Backend Receiving JWT?
```bash
# Backend logs should show:
[DEBUG] Authorization header found
[DEBUG] Token starts with: eyJhbGciOiJIUzI1NiIsInR...
```

### Is JWT Verification Working?
```bash
# Backend logs should show:
[DEBUG] JWT verification successful
OR
[ERROR] JWT verification failed
```

### Is User/Profile Being Created?
```bash
# Backend logs should show:
[DEBUG] User created successfully
[DEBUG] Profile created successfully
OR
[ERROR] Creating user failed: ...
```

### Is Response Valid?
```bash
# DevTools → Network → POST /auth/register → Response tab
# Should contain:
{
  "data": {
    "id": "...",           // ← Must exist
    "email": "...",        // ← Must exist  
    "fullName": "..."      // ← Must exist
  }
}
```

---

## Common Fixes

| Problem | Check | Fix |
|---------|-------|-----|
| JWT not sent | Network tab headers | Are we running frontend on same origin? |
| JWT invalid | Backend logs | Update SUPABASE_JWT_SECRET in backend .env |
| User not created | Backend logs + DB | Check DB constraints, check userId format |
| Profile not created | Backend logs + DB | Check foreign key to user, check required fields |
| Response missing fields | Network Response tab | Add all required fields before returning |
| GET /auth/me fails after POST | Backend logs | Ensure GET /auth/me queries the profile we just created |

---

## Next Steps if Error Persists

1. **Enable verbose logging:**
   - Backend: Log every step (receive request → verify → create → respond)
   - Frontend: Check DevTools Console for stack traces

2. **Verify JWT Token:**
   - Copy token from Network tab
   - Paste at jwt.io to decode it
   - Check expiration time and claims

3. **Check Database:**
   - Query user table: Does the record exist?
   - Query profile table: Does the record exist?
   - Are IDs matching?

4. **Check API Response:**
   - Is HTTP status 200/201 (not 500)?
   - Is response body valid JSON?
   - Does it contain required fields?

5. **Check Supabase::**
   - Is SUPABASE_JWT_SECRET correct?
   - Is Supabase project live and accessible?
   - Is user authenticated in Supabase auth?
