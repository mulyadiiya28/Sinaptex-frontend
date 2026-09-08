# Quick Reference: Registration Error Flow

## Error Message Path
```
User clicks "Selesaikan Pendaftaran" on /register page
    ↓
POST /api/v1/auth/register (with JWT token in Authorization header)
    ↓
[Backend must verify JWT and save User+Profile]
    ↓
Frontend receives response
    ↓
Frontend calls GET /api/v1/auth/me to verify
    ↓
❌ GET /auth/me fails with error message
    ↓
Error thrown: "Server belum menyimpan User/Profile. Cek token JWT Supabase di backend (verifySupabaseToken) dan response POST /auth/register."
```

---

## Frontend Code That Triggers This Error

**File:** [src/app/register/page.tsx](src/app/register/page.tsx#L128-L175)

```typescript
async function handleRegisterProfile(e: React.FormEvent) {
  e.preventDefault();
  if (submittingRef.current) return;
  submittingRef.current = true;
  setLoading(true);
  setError("");
  setDebugHint("");

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const session = sessionData.session;
    if (!session?.access_token) {
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
    }

    // Validate inputs
    const name = fullName.trim();
    if (name.length < 2) throw new Error("Nama lengkap minimal 2 karakter.");
    if (phone.trim() && phone.trim().length < 8) {
      throw new Error("Nomor telepon minimal 8 digit (atau kosongkan).");
    }

    const body: { fullName: string; phone?: string } = { fullName: name };
    if (phone.trim()) body.phone = phone.trim();

    setDebugHint("Mengirim POST /api/v1/auth/register …");

    // 1️⃣ POST /api/v1/auth/register with JWT token in Authorization header
    const profile = await authApi.register(body);

    // 2️⃣ Response must include id and fullName
    if (!profile?.id || !profile.fullName) {
      throw new Error(
        "Backend tidak mengembalikan profil lengkap. Cek response POST /auth/register di Network."
      );
    }

    // 3️⃣ Cache in local state
    setMe(profile);
    queryClient.setQueryData(authKeys.me, profile);
    
    setDebugHint("Profil tersimpan di server. Mengarah ke dashboard…");
    router.replace("/dashboard");
    
  } catch (err: unknown) {
    // Show error to user
    submittingRef.current = false;
    const msg = err instanceof Error ? err.message : "Gagal mendaftar";
    setError(friendlyAuthError(msg));
    setDebugHint(
      "Buka DevTools → Network → filter 'register'. Status harus 200/201. Body harus berisi user/profile."
    );
  } finally {
    setLoading(false);
  }
}
```

---

## Where The Error Actually Thrown

**File:** [src/features/auth/auth.api.ts](src/features/auth/auth.api.ts#L55-L90)

```typescript
export const authApi = {
  register: async (input: RegisterProfileInput): Promise<Me> => {
    // ✓ Step 1: POST /api/v1/auth/register
    const raw = await apiClient.post<unknown>("/api/v1/auth/register", input);
    const fromRegister = normalizeMe(raw);

    // ✓ Step 2: Verify by calling GET /api/v1/auth/me (300ms delay for DB write)
    try {
      await new Promise((r) => setTimeout(r, 300));
      const meRaw = await apiClient.get<unknown>("/api/v1/auth/me");
      const me = normalizeMe(meRaw);
      if (me?.id) return me;  // ✓ Everything OK
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      
      // ❌ GET /auth/me failed
      // If register at least returned a profile, use that
      if (fromRegister?.id) return fromRegister;
      
      // ❌ No profile from register either - throw error
      throw new Error(
        msg.includes("not registered") || msg.includes("Complete registration")
          ? "Server belum menyimpan User/Profile. Cek token JWT Supabase di backend (verifySupabaseToken) dan response POST /auth/register."
          : msg
      );
    }

    // ❌ If we get here, POST didn't return profile
    if (fromRegister?.id) return fromRegister;

    throw new Error(
      "Register tidak mengembalikan profil. Periksa Network → POST /api/v1/auth/register (status & body)."
    );
  },

  me: async (): Promise<Me> => {
    const raw = await apiClient.get<unknown>("/api/v1/auth/me");
    const me = normalizeMe(raw);
    
    // ❌ This is what triggers the error:
    if (!me?.id) {
      throw new Error("Account not registered locally. Complete registration first.");
    }
    return me;
  },
};
```

---

## What Backend Needs To Return

**File:** [src/features/auth/auth.schema.ts](src/features/auth/auth.schema.ts#L20-L38)

The `registerProfileInput` to backend:
```typescript
interface RegisterProfileInput {
  fullName: string;
  phone?: string;
  bio?: string;
  location?: string;
  party?: { name: string; isCompany?: boolean; ... };
  businessRoles?: string[];
  capabilityNames?: string[];
}
```

Backend must return a `Me` object:
```typescript
interface Me {
  id: string;                           // ← CRITICAL: Must be present
  email: string;                        // ← CRITICAL: Must be present
  fullName: string;                     // ← CRITICAL: Must be present
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  isVerified?: boolean;
  avatarUrl?: string | null;
  accountStatus?: string;
  businessRoles?: Array<{ role: string }> | null;
  parties?: Array<Record<string, unknown>> | null;
  createdAt?: string;
  updatedAt?: string;
}
```

**At minimum, these 3 fields MUST be present:**
- `id` (user ID or profile ID)
- `email` (from JWT token)
- `fullName` (from request body)

---

## Backend Implementation Checklist

### ✅ Receive Request
```
POST /api/v1/auth/register
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "phone": "081234567890"
}
```

### ✅ Verify JWT Token
```javascript
function verifySupabaseToken(token: string) {
  // 1. Extract from Authorization header
  const bearerToken = token.replace("Bearer ", "");
  
  // 2. Verify signature using SUPABASE_JWT_SECRET
  const decoded = jwtVerify(bearerToken, process.env.SUPABASE_JWT_SECRET);
  
  // 3. Return decoded payload (contains sub = user ID)
  return decoded.payload;
}
```

### ✅ Create User Record
```javascript
const userId = decoded.sub;  // From JWT
const email = decoded.email;  // From JWT

await db.user.create({
  id: userId,
  email: email,
  provider: "supabase",
  // other fields
});
```

### ✅ Create Profile Record
```javascript
await db.profile.create({
  id: createId(),           // or use userId if using single table
  userId: userId,           // Foreign key
  email: email,             // Denormalize
  fullName: input.fullName,
  phone: input.phone || null,
  isVerified: false,
  accountStatus: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### ✅ Return Complete Profile
```javascript
return res.json({
  success: true,
  message: "User registered successfully",
  data: {
    id: profile.id,
    email: email,
    fullName: input.fullName,
    phone: input.phone,
    bio: null,
    location: null,
    isVerified: false,
    avatarUrl: null,
    accountStatus: "active"
  }
});
```

### ✅ Implement GET /auth/me
```javascript
app.get("/api/v1/auth/me", async (req, res) => {
  // 1. Verify JWT from Authorization header
  const token = req.headers.authorization?.replace("Bearer ", "");
  const decoded = verifySupabaseToken(token);
  
  // 2. Query user + profile from database
  const profile = await db.profile.findUnique({
    where: { userId: decoded.sub }
  });
  
  // 3. Return profile or throw "not registered" error
  if (!profile) {
    return res.status(404).json({
      error: "Account not registered locally. Complete registration first."
    });
  }
  
  return res.json({
    success: true,
    data: profile
  });
});
```

---

## Testing Sequence

### 1. User Registers
- Fill form with email, password, full name, phone
- Click "Selesaikan Pendaftaran"

### 2. Frontend Sends
```
POST /api/v1/auth/register
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fullName": "John Doe",
  "phone": "081234567890"
}
```

### 3. Backend Should Log
```
[2024-09-08T10:30:45Z] POST /api/v1/auth/register
  Authorization: Bearer eyJ... (valid Supabase JWT)
  Body: { fullName: "John Doe", phone: "081234567890" }

[DEBUG] JWT verification ✓ Success
  userId: uuid-xxx
  email: john@example.com

[DEBUG] User created ✓: uuid-xxx

[DEBUG] Profile created ✓: uuid-xxx

[Response] 200 OK
  {
    "success": true,
    "data": {
      "id": "uuid-xxx",
      "email": "john@example.com",
      "fullName": "John Doe",
      "phone": "081234567890"
    }
  }
```

### 4. Frontend Verifies
```
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

[Response] 200 OK
  {
    "success": true,
    "data": {
      "id": "uuid-xxx",
      "email": "john@example.com",
      "fullName": "John Doe",
      "phone": "081234567890"
    }
  }
```

### 5. Success
- Frontend stores profile in session store
- Redirects to /dashboard  
- User sees dashboard with their name

---

## If Error Occurs

**Error shown to user:**
```
Server belum menyimpan User/Profile. Cek token JWT Supabase di backend 
(verifySupabaseToken) dan response POST /auth/register.

Buka DevTools → Network → filter 'register'. Status harus 200/201. 
Body harus berisi user/profile.
```

**Debugging steps:**
1. Open DevTools → Network tab
2. Filter requests by "register"
3. Find POST `/api/v1/auth/register`
4. Check:
   - **Status:** Should be 200 or 201 (not 401, 403, 500)
   - **Request Headers:** Should have `Authorization: Bearer ...`
   - **Response Body:** Should have `id`, `email`, `fullName`
5. If status is:
   - **401/403:** JWT verification failing on backend
   - **500:** Backend error (check server logs)
   - **200 but missing fields:** Backend not saving correctly
