# Backend Diagnosis Verification Framework

## Diagnosis #1: SUPABASE_JWT_SECRET Mismatch
> Token "keliatan" valid format tapi verifikasi signature gagal, middleware fallback ke silent no-op alih-alih 401 tegas.

### Evidence dari Frontend

**File:** [src/lib/api-client.ts](src/lib/api-client.ts#L83-L90)

Frontend **selalu mengirim** JWT token ke setiap request:
```typescript
if (auth) {
  try {
    const token = await getAccessToken();
    if (token) authHeaders.Authorization = `Bearer ${token}`;
  } catch {
    // ignore token fetch error if offline
  }
}

return fetch(buildUrl(path, params), {
  headers: {
    "Content-Type": "application/json",
    ...authHeaders,  // ← Always includes Authorization header
    ...headers,
  },
});
```

**Token Source:** Valid Supabase JWT dari sesi authenticated user
```typescript
// src/lib/supabase-client.ts
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
```

### What Should Happen (Backend)

✅ **Scenario A: Correct SUPABASE_JWT_SECRET**
```
POST /api/v1/auth/register
Authorization: Bearer <valid_supabase_jwt>

[Backend]
1. Extract token from Authorization header
2. Verify signature using SUPABASE_JWT_SECRET from .env
3. Signature verification ✓ PASS
4. Decode JWT → get userId, email
5. Create User + Profile
6. Return 200 { id, email, fullName }
```

❌ **Scenario B: Wrong SUPABASE_JWT_SECRET**
```
POST /api/v1/auth/register
Authorization: Bearer <valid_supabase_jwt>

[Backend]
1. Extract token from Authorization header
2. Verify signature using WRONG SUPABASE_JWT_SECRET from .env
3. Signature verification ✗ FAIL
   - If handled correctly: Return 401 "Unauthorized"
   - If silent fallback: Continue as anonymous, create with null userId
4. (If silent) Create User/Profile with empty userId
5. (If silent) Return 200 { id: null, email: "from header?", ... }

[Frontend]
GET /api/v1/auth/me (300ms after POST)
→ Cannot find profile (no valid userId in DB)
→ 404 "Account not registered locally"
→ Error: "Server belum menyimpan..."
```

### How to Verify Diagnosis #1

**On Backend:**
1. Check `.env` file: Is `SUPABASE_JWT_SECRET` present?
2. Get your Supabase project's JWT secret from Dashboard → Settings → API
3. Compare: Does `.env` JWT_SECRET match dashboard secret exactly?
4. Add logging:
```javascript
app.post('/api/v1/auth/register', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  try {
    const decoded = jwtVerify(token, process.env.SUPABASE_JWT_SECRET);
    console.log('[✓] JWT signature verified:', decoded.sub);
  } catch (error) {
    console.error('[✗] JWT verification failed:', error.message);
    // Should return 401, NOT continue
    return res.status(401).json({ error: error.message });
  }
});
```

**On Frontend DevTools:**
1. Open Network tab
2. POST /api/v1/auth/register
3. Check Response Status:
   - **200/201** = Backend silently continued (likely Diagnosis #1)
   - **401** = Backend rejected JWT (correct behavior)

---

## Diagnosis #2: Prisma Transaction Fails, Error Swallowed
> Transaksi Prisma gagal (constraint/duplikat) tapi errornya ditelan, controller tetap balas 200/201 walau User/Profile tidak ke-create.

### Error Flow

```
POST /api/v1/auth/register

[Backend - IF DIAGNOSIS #1 IS TRUE]
1. JWT verification fails silently
2. userId = undefined/null
3. Try to create User with id=undefined
   [DB Error] "Cannot insert NULL into User.id"
   OR [DB Error] "Unique constraint violation"
4. Catch block:
   catch (error) {
     console.log(error);  // Error logged but not thrown
     // Missing: throw error or return res.status(500)
   }
5. Controller continues
6. Return 200 { id: fromRegister?.id } (undefined)
7. Frontend receives { id: undefined }

[Frontend]
if (!profile?.id || !profile.fullName) {
  throw new Error("Backend tidak mengembalikan profil lengkap")
}
```

### Code Pattern to Look For (Backend)

❌ **Bad Pattern (Swallows Error):**
```javascript
async function authController(req, res) {
  try {
    const profile = await authService.register({
      fullName: req.body.fullName,
      userId: req.user?.id  // ← Could be undefined if JWT failed
    });
    
    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error:', error); // ← Just logs, doesn't re-throw
    // Continue...
  }
  
  // If we get here with no profile, return anyway
  return res.json({ success: false, data: {} }); // Still 200!
}
```

✅ **Good Pattern (Rejects Properly):**
```javascript
async function authController(req, res) {
  try {
    const profile = await authService.register({
      fullName: req.body.fullName,
      userId: req.user?.id
    });
    
    if (!profile?.id) {
      return res.status(400).json({ error: "Profile creation failed" });
    }
    
    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });  // ← Explicit 5xx
  }
}
```

### How to Verify Diagnosis #2

**On Backend:**
1. Find auth controller's error handling
2. Check: Does it `throw` errors or just `catch` them silently?
3. Check: Does it verify response before returning?
4. Add logging:
```javascript
async function register(input) {
  console.log('[register] Creating user with:',
    { userId: input.userId, fullName: input.fullName }
  );
  
  if (!input.userId) {
    throw new Error('userId is required but undefined');
  }
  
  try {
    const user = await db.user.create({
      id: input.userId,
      email: input.email
    });
    console.log('[✓] User created:', user.id);
  } catch (error) {
    console.error('[✗] User creation failed:', error.message);
    throw error;  // ← Must re-throw!
  }
  
  try {
    const profile = await db.profile.create({
      userId: input.userId,
      fullName: input.fullName
    });
    console.log('[✓] Profile created:', profile.id);
    return profile;
  } catch (error) {
    console.error('[✗] Profile creation failed:', error.message);
    throw error;  // ← Must re-throw!
  }
}
```

**On Frontend DevTools:**
1. Check Response Status:
   - **200** with empty/null `id` = Diagnosis #2 confirmed
   - **500** = Properly catching and rejecting error

---

## Diagnosis #3: req.user/req.profile Not Attached After JWT Verification
> req.user/req.profile tidak ke-attach dengan benar, jadi userId yang dikirim ke service adalah salah/kosong.

### JWT Decode Flow

```
[Middleware - JWT Verification]

1. Extract token from Authorization header
2. Verify signature
3. Decode JWT → payload { sub: "user-id", email: "...", ... }
4. CRITICAL: Attach to req.user or req.profile
   ✓ Good: req.user = { id: payload.sub, email: payload.email }
   ✓ Good: req.profile = { userId: payload.sub }
   ✗ Bad: Forget to attach
   ✗ Bad: Attach with wrong property name
   ✗ Bad: Attach with empty value

[Controller]

5. Access req.user.id or req.profile.userId
   ✓ If attached: userId = "valid-uuid"
   ✗ If not attached: userId = undefined
   ✗ If wrong property: userId = undefined
```

### Code Pattern to Look For (Backend)

❌ **Bad Pattern (Not Attached):**
```javascript
// middleware/auth.js
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  try {
    const decoded = jwtVerify(token, process.env.SUPABASE_JWT_SECRET);
    // ✗ Decoded but not attached to req
    // Missing: req.user = { id: decoded.sub, ... }
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
  
  next();
});

// controller/auth.js
app.post('/api/v1/auth/register', (req, res) => {
  const userId = req.user?.id;  // ← undefined!
  // ...
});
```

❌ **Bad Pattern (Wrong Property Name):**
```javascript
// middleware/auth.js
const decoded = jwtVerify(token, secret);
req.profile = decoded;  // ← Attached but wrong structure

// controller/auth.js
const userId = req.user?.id;  // ← Getting from req.user, not req.profile
// userId is undefined
```

✅ **Good Pattern (Properly Attached):**
```javascript
// middleware/auth.js
const decoded = jwtVerify(token, process.env.SUPABASE_JWT_SECRET);
req.user = {
  id: decoded.sub,  // ← Supabase uses "sub" for user ID
  email: decoded.email,
  // ... other fields
};

// controller/auth.js
const userId = req.user.id;  // ← "uuid-xxxxx"
const email = req.user.email;  // ← "user@example.com"
```

### How to Verify Diagnosis #3

**On Backend:**
1. Find JWT verification middleware
2. Check: Does it attach decoded JWT to req?
3. Check: What property name is used (req.user vs req.profile)?
4. Check: Is userId passed correctly from controller → service
5. Add logging:
```javascript
// middleware
const decoded = jwtVerify(token, secret);
console.log('[JWT Decoded]:', { sub: decoded.sub, email: decoded.email });
req.user = { id: decoded.sub, email: decoded.email };
console.log('[Attached to req]:', req.user);
next();

// controller
app.post('/api/v1/auth/register', (req, res) => {
  console.log('[Controller] req.user:', req.user);
  const userId = req.user?.id;
  console.log('[Controller] userId:', userId);  // ← Should be UUID, not undefined
});

// service
async function register(input) {
  console.log('[Service] Received:', input);
  console.log('[Service] Creating with userId:', input.userId);  // ← Check if defined
}
```

**On Frontend DevTools:**
1. Create new user
2. Check Network → POST /auth/register response
3. Look at response body:
   - **Has valid `id`** = req.user properly attached
   - **Has `id: null` or missing** = req.user NOT attached (Diagnosis #3)

---

## Verification Checklist

### Step 1: Check Backend Logs After Registration Attempt

```
[2024-09-08 10:30:45] POST /api/v1/auth/register
```

**Look for:**

- [ ] Authorization header received?
  ```
  [✓] Authorization header found: Bearer eyJ...
  [✗] No Authorization header
  ```

- [ ] JWT verification result?
  ```
  [✓] JWT signature verified: user-uuid-123
  [✗] JWT verification failed: signature verification failed
  ```

- [ ] req.user attached?
  ```
  [✓] Attached to req.user: { id: 'user-uuid-123', email: '...' }
  [✗] req.user is undefined
  ```

- [ ] userId passed to service?
  ```
  [✓] Creating with userId: 'user-uuid-123'
  [✗] Creating with userId: undefined
  ```

- [ ] User created?
  ```
  [✓] User created successfully
  [✗] User creation failed: Unique constraint violated
  ```

- [ ] Profile created?
  ```
  [✓] Profile created successfully
  [✗] Profile creation failed: ...
  ```

- [ ] Response status?
  ```
  [✓] Returning 200 with { id: 'profile-uuid', ... }
  [✗] Returning 200 with { id: null, ... }
  [✗] Error caught but swallowed, returning 200 anyway
  ```

### Step 2: Check Frontend Network Response

```
POST /api/v1/auth/register
Status: 200
Response: {
  "data": {
    "id": "???"
  }
}
```

**Interpret Response:**

| Response `id` | Diagnosis | Root Cause |
|---|---|---|
| `null` or missing | #2 or #3 | Prisma failed due to undefined userId, error swallowed |
| `"valid-uuid"` | ✓ Success | User/Profile created correctly |
| Error status 401 | Fix #1 | JWT validation rejected (correct!) |
| Error status 500 | ✓ Good | Server properly rejected invalid request |

### Step 3: Check Database State

After registration attempt:

```sql
-- Check User record
SELECT id, email FROM "user" WHERE email = 'test@example.com';
-- Expected: Returns row with valid UUID
-- Diagnosis #3: Returns no rows (userId was null/undefined)

-- Check Profile record
SELECT id, userId, fullName FROM "profile" WHERE userId IS NOT NULL;
-- Expected: Return rows with userId
-- Diagnosis #2/3: Returns no rows (creation failed or userId was null)

-- Check NULL userId records (ghost profiles)
SELECT id, userId, fullName FROM "profile" WHERE userId IS NULL;
-- If found: Confirms #2 or #3 (transactions failing)
```

### Step 4: Verify All Three Together

| Diagnosis | JWT Logs | Service Logs | DB Result | Response |
|---|---|---|---|---|
| **#1 Only** | "verification failed" OR verified but wrong secret | userId=null, transaction fails | No User/Profile | 200 { id: null } |
| **#2 Only** | ✓ Verified correctly | ✓ userId attached but transaction error swallowed | Partial creates OR no creates | 200 { id: null } |
| **#3 Only** | ✓ Verified correctly | ✗ userId undefined | No creates | 200 { id: null } |
| **All Three** | Silent fail | Multiple failures | Ghost data | 200 { id: null } |
| **✓ Correct** | ✓ Verified | ✓ userId attached | User + Profile created | 200 { id, email, fullName } |

---

## Summary: How to Prove Each Diagnosis

### Diagnosis #1 Proof
```
Add logging to verify middleware:
  if (signature verification fails) {
    console.error('[✗] JWT Verification Failed');
    return res.status(401);  // ← Should be 401, not 200
  }
```

### Diagnosis #2 Proof
```
Add logging to error handler:
  catch (error) {
    console.error('[✗] Transaction Failed:', error.message);
    throw error;  // ← Should re-throw, not silently continue
  }
```

### Diagnosis #3 Proof
```
Add logging after JWT decode:
  console.log('[JWT] Decoded payload:', decoded);
  req.user = { id: decoded.sub, ... };
  console.log('[Middleware] Attached req.user:', req.user);
  // Then in controller:
  console.log('[Controller] req.user:', req.user);
```

---

## Next Action

With backend logs showing these diagnostics, you can:

1. **If #1:** Fix SUPABASE_JWT_SECRET mismatch
2. **If #2:** Add proper error rejection in controller
3. **If #3:** Ensure JWT payload attached to req correctly
4. **If Multiple:** Fix all three step by step

Each diagnosis points to different backend code to fix.
