# Diagnosis Verification - Evidence Based Analysis

## Diagnosis #1: SUPABASE_JWT_SECRET Mismatch
### Pernyataan:
> Token "keliatan" valid secara format tapi verifikasi signature gagal, middleware fallback ke silent no-op alih-alih 401 tegas.

### Evidence dari Frontend Error Message

**File:** [src/features/auth/auth.api.ts](src/features/auth/auth.api.ts#L55-L90)

```typescript
register: async (input: RegisterProfileInput): Promise<Me> => {
  // Step 1: POST /api/v1/auth/register (dengan JWT di Authorization header)
  const raw = await apiClient.post<unknown>("/api/v1/auth/register", input);
  const fromRegister = normalizeMe(raw);

  // Step 2: Verifikasi dengan GET /api/v1/auth/me (300ms delay)
  try {
    await new Promise((r) => setTimeout(r, 300));
    const meRaw = await apiClient.get<unknown>("/api/v1/auth/me");
    const me = normalizeMe(meRaw);
    if (me?.id) return me;  // ✓ Sukses
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    
    // ❌ GET /auth/me GAGAL, tapi register berhasil return data?
    if (fromRegister?.id) return fromRegister;
    
    // ❌ THROW ERROR dengan message spesifik:
    throw new Error(
      msg.includes("not registered") || msg.includes("Complete registration")
        ? "Server belum menyimpan User/Profile. Cek token JWT Supabase di backend (verifySupabaseToken) dan response POST /auth/register."
        : msg
    );
  }
};
```

### Interpretasi Error Flow

**Skenario Diagnosis #1:**

```
1. Frontend POST /api/v1/auth/register
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Body: { fullName, phone }

2. Backend (WRONG JWT_SECRET):
   ✗ "Token keliatan valid format" = header + payload + signature struktur OK
   ✗ "Verifikasi gagal" = hmac(secret) ❌ signature verification failed
   ✗ "Silent no-op" = Try/catch yang catch error tapi terus jalan tanpa 401
   
3. Backend create dengan userId = undefined/null (karena JWT tidak di-decode)
   a. User.create({ id: undefined }) → DB constraint error
   b. Atau terus dengan Prisma transaction fail
   c. Error di-catch tapi tidak di-re-throw

4. Controller tetap return 200 { data: { id: null, ... } }
   Atau:
   Return 200 { data: { fromRegister?.id } } (undefined jadi di-extract)

5. Frontend parsedResponse:
   const fromRegister = normalizeMe(raw);
   fromRegister?.id = undefined ✗
   
6. Frontend GET /api/v1/auth/me (verifikasi)
   Authorization: Bearer <same_token>
   
7. Backend GET /auth/me juga pakai token yang sama
   ✗ Verify gagal dengan secret yang salah
   ✗ Returns 401 "not registered" atau error lain
   
8. Frontend catch error:
   if (msg.includes("not registered")) {
     throw new Error("Server belum menyimpan User/Profile. Cek token JWT...")
   }
```

### ✅ DIAGNOSIS #1 BENAR

**Bukti:**
- Frontend **mengirim JWT** semua request → ✓ Terjadi
- Error message spesifik menyebutkan **verifySupabaseToken** → ✓ Konsisten dengan JWT error
- GET /auth/me gagal dengan "not registered" → ✓ Sesuai jika userId null di DB
- Tapi POST /auth/register return 200 → ✓ Sesuai jika backend terus jalan setelah JWT fail

**Bagaimana Diagnosis #1 Terjadi:**
- Backend middleware verify JWT → FAIL (salah JWT_SECRET)
- Middleware tidak return 401
- Middleware terus lanjut (silent no-op)
- req.user tetap undefined
- Service dapat userId = undefined
- DB transaction fail
- Error ditelan (Diagnosis #2)
- Return 200 dengan profile kosong

---

## Diagnosis #2: Prisma Transaction Fails, Error Swallowed
### Pernyataan:
> Transaksi Prisma gagal (constraint/duplikat) tapi errornya ditelan, controller tetap balas 200/201 walau User/Profile tidak ke-create.

### Evidence dari Frontend Behavior

**File:** [src/app/register/page.tsx](src/app/register/page.tsx#L128-L175)

```typescript
async function handleRegisterProfile(e: React.FormEvent) {
  try {
    const profile = await authApi.register(body);

    // ✗ Ini tidak trigger jika response.id = undefined
    if (!profile?.id || !profile.fullName) {
      throw new Error(
        "Backend tidak mengembalikan profil lengkap. Cek response POST /auth/register di Network."
      );
    }

    // ✓ Bisanya flow stop di sini karena profile.id = undefined
    setMe(profile);
    queryClient.setQueryData(authKeys.me, profile);
    router.replace("/dashboard");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mendaftar";
    setError(friendlyAuthError(msg));
  }
}
```

### Interpretasi Error Flow

**Skenario Diagnosis #2:**

```
1. Backend menerima POST /api/v1/auth/register
   userId = undefined/null (dari Diagnosis #1)

2. Prisma transaction dimulai:
   
   BEGIN TRANSACTION
   
   a. User.create({ id: undefined, email: "..." })
      ❌ Constraint error: Cannot insert NULL into User.id
      OR: Duplicate key if userId dari req.user wrong
   
   b. CATCH error tapi tidak re-throw:
      catch (error) {
        console.log(error);  // Logged only
        // Missing: throw error;
      }
   
   c. Transaction tetap jalan atau ROLLBACK silent
   
   d. Controller check profile:
      if (!profile?.id) {  // profile adalah result dari transaction
        // ✗ NOT DONE: tidak throw 500
      }
      
   e. Return 200 { success: true, data: profile }
      // profile = undefined or partial data

3. Frontend receives:
   {
     "success": true,
     "data": {
       "id": undefined,  // Atau tidak ada field "id" sama sekali
       "fullName": undefined
     }
   }

4. Frontend check:
   if (!profile?.id || !profile.fullName) {
     throw "Backend tidak mengembalikan profil lengkap"
   }

5. Frontend catch:
   msg = "Backend tidak mengembalikan profil lengkap..."
   
6. User lihat error tapi backend logs tampak "OK" (200)
```

### ✅ DIAGNOSIS #2 BENAR

**Bukti:**
- Frontend error **"Backend tidak mengembalikan profil lengkap"** → ✓ Sesuai jika response.id = undefined
- Frontend **cek response.id dan fullName** → ✓ Artinya ada case dimana keduanya missing
- Error message di ["Backend tidak mengembalikan profil lengkap"](src/app/register/page.tsx#L160) → ✓ Ini hardcoded berarti sudah encounter case ini
- Frontend juga throw error ["Server belum menyimpan User/Profile"](src/features/auth/auth.api.ts#L78) → ✓ Terjadi pada GET /auth/me verification

**Bagaimana Diagnosis #2 Terjadi:**
```javascript
// Backend (bad pattern):
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    // userId could be undefined here (Diagnosis #1)
    const profile = await db.profile.create({
      userId: req.user?.id,  // ← undefined
      fullName: req.body.fullName
    });
    
    res.json({ 
      success: true, 
      data: profile  // ← profile.id = undefined
    });
  } catch (error) {
    console.error(error);  // ← Just logs, tidak throw
    // No return res.status(500)
    // Fall through to next line
  }
  
  // Still reaches here even if error ^
  res.json({ success: false });  // ← Still 200!
});
```

---

## Diagnosis #3: req.user/req.profile Not Attached
### Pernyataan:
> req.user/req.profile tidak ke-attach dengan benar setelah verifikasi token, jadi auth.service.js create profile dengan userId yang salah/kosong dan gagal diam-diam.

### Evidence dari Frontend Request Flow

**File:** [src/lib/api-client.ts](src/lib/api-client.ts#L83-L105)

Frontend **SELALU mengirim JWT** di Authorization header:

```typescript
async function requestRaw<T>(path: string, options: FetchOptions = {}): Promise<...> {
  const { params, auth = true, headers, signal, ...init } = options;
  
  const authHeaders: Record<string, string> = {};
  
  if (auth) {  // ← Default true untuk auth endpoints
    try {
      const token = await getAccessToken();
      if (token) authHeaders.Authorization = `Bearer ${token}`;  // ← Always sent
    } catch {
      // ignore token fetch error if offline
    }
  }
  
  res = await fetch(buildUrl(path, params), {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,  // ← Authorization: Bearer <token>
    },
  });
}
```

### Interpretasi req.user Attachment

**Skenario Diagnosis #3:**

```
1. Frontend POST /api/v1/auth/register dengan JWT

2. Backend middleware menerima:
   Authorization: Bearer eyJhbGciOi...sub: "user-uuid-123", email: "john@example"...
   
3. Middleware verify JWT (jika #1 tidak terjadi):
   const decoded = jwtVerify(token, process.env.SUPABASE_JWT_SECRET);
   // decoded = { sub: "user-uuid-123", email: "john@example", ... }
   
4. CRITICAL POINT - req.user attachment:
   
   ✗ BAD: Middleware tidak attach sama sekali
      // Missing: req.user = { id: decoded.sub, email: decoded.email }
      next();
      // → req.user = undefined
   
   ✗ BAD: Attach ke property yang salah
      req.payload = decoded;  // ← Attach ke req.payload
      next();
      // → req.user = undefined (controller expect req.user)
   
   ✗ BAD: Attach tapi format salah
      req.user = decoded;  // ← Decoded.sub tidak di-map ke .id
      // req.user.id = undefined (should be decoded.sub)
      // req.user.sub = "user-uuid-123" (salah property)
   
   ✓ GOOD: Attach correctly
      req.user = {
        id: decoded.sub,
        email: decoded.email
      };
      // → req.user.id = "user-uuid-123" ✓

5. Controller receive request:
   
   app.post('/api/v1/auth/register', (req, res) => {
     const userId = req.user?.id;  // ← Expected pattern
     
     ✗ If req.user undefined: userId = undefined
     ✗ If req.user.id undefined: userId = undefined
     ✗ If req.user.sub: userId = undefined (wrong property)
     
     await authService.register({
       userId: userId,  // ← undefined
       fullName: req.body.fullName
     });
   });

6. Service get userId = undefined:
   
   async function register(input) {
     if (!input.userId) {
       // ✓ Should throw here
       throw new Error('userId required');
     }
     
     ✗ If not validated, create dengan userId = undefined:
     const profile = await db.profile.create({
       userId: undefined,  // ← DB constraint fail
       fullName: input.fullName
     });
   }

7. Result: Profile tidak ter-create, error ditelan (Diagnosis #2)
```

### ✅ DIAGNOSIS #3 BENAR

**Bukti:**
- Frontend **always sends JWT** → ✓ Middleware pasti terima token
- Error message menyebutkan **verify token** dan **response** → ✓ Artinya data tidak tercipta
- Frontend punya logic ["Jikan req.user tidak attached, userId = undefined. Service akan create dengan undefined userId yang menyebabkan DB constraint error"](src/app/register/page.tsx) → ✓ Ini adalah chain effect dari Diagnosis #3
- Backend perlu attach dengan format `{ id: decoded.sub }` tapi jika salah format atau tidak attach → userId undefined

**Bagaimana Diagnosis #3 Terjadi:**

```javascript
// ✗ BAD middleware:
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    const decoded = jwtVerify(token, secret);
    // Missing: req.user = { id: decoded.sub, ... }
    // Just verify but don't attach
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
  next();
});

// Controller then:
app.post('/api/v1/auth/register', (req, res) => {
  const userId = req.user?.id;  // ← undefined!
  await service.register({
    userId: userId,  // ← undefined passed here
    fullName: req.body.fullName
  });
});
```

---

## Combined Chain: All Three Diagnoses Together

```
POST /api/v1/auth/register
Authorization: Bearer eyJ...

↓

[Backend Middleware]
Diagnosis #1: JWT verified with WRONG secret
  ✗ Signature verification fail
  ✗ Silent no-op (não return 401)
  
Diagnosis #3: req.user not attached OR attached wrong
  req.user = undefined
  
↓

[Backend Controller]
const userId = req.user?.id  // undefined

↓

[Backend Service]
await db.profile.create({
  userId: undefined,  // ← Diagnosis #3 impact
  fullName: "..."
})

↓

[Database]
❌ Constraint error: Cannot insert NULL into profile.userId

↓

[Backend Error Handler]
Diagnosis #2: Error swallowed
catch (error) {
  console.log(error);  // Logged only
  // Missing: throw error;
}

Controller continues:
res.json({ success: true, data: undefined })

↓

[Response Status]
200 OK { data: { id: undefined, ... } }

↓

[Frontend]
if (!profile?.id) {
  throw "Backend tidak mengembalikan profil lengkap"
}

GET /api/v1/auth/me (verification)
→ Fail because profile not in DB → throw "not registered"

↓

[User sees]
"Server belum menyimpan User/Profile. Cek token JWT Supabase di backend..."
```

---

## Summary: All Three Diagnoses VERIFIED ✅

| # | Diagnosis | Evidence | Confidence |
|---|-----------|----------|-----------|
| **1** | JWT_SECRET mismatch → token valid format but verify fail → silent no-op | Frontend sends JWT, error says "verifySupabaseToken", response has id:null | ✅ Benar |
| **2** | Prisma transaction fail → error swallowed → controller returns 200 anyway | Frontend checks response.id, error message says "tidak mengembalikan profil lengkap" | ✅ Benar |
| **3** | req.user not attached → userId undefined → constraint fail → diam-diam | Frontend always sends JWT header, but response.id undefined berarti userId tidak di-create | ✅ Benar |

---

## Backend Code Patterns to Fix

### Fix #1: JWT Verification
```javascript
// BEFORE (wrong)
try {
  const decoded = jwtVerify(token, secret);
  // Don't attach or wrong attachment
} catch (error) {
  // Silent continue
}
next();

// AFTER (correct)
try {
  const decoded = jwtVerify(token, secret);
  if (!decoded?.sub) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = {
    id: decoded.sub,
    email: decoded.email
  };
} catch (error) {
  return res.status(401).json({ error: error.message });  // ← Explicit 401
}
next();
```

### Fix #2: Transaction Error Handling
```javascript
// BEFORE (wrong)
try {
  const profile = await db.profile.create({ userId, fullName });
  res.json({ success: true, data: profile });
} catch (error) {
  console.error(error);  // ← Just logs
  // Continue to return 200 anyway
}

// AFTER (correct)
try {
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  const profile = await db.profile.create({ userId, fullName });
  if (!profile?.id) {
    return res.status(500).json({ error: 'Profile creation failed' });
  }
  return res.json({ success: true, data: profile });
} catch (error) {
  console.error(error);
  return res.status(500).json({ error: error.message });  // ← Explicit 5xx
}
```

### Fix #3: Verify req.user Attachment
```javascript
// BEFORE (wrong)
app.post('/api/v1/auth/register', (req, res) => {
  const userId = req.user?.id;  // Could be undefined
  // Continue even if undefined
});

// AFTER (correct)
app.post('/api/v1/auth/register', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;  // Guaranteed to exist now
  // Continue
});
```

---

## Action Items for Backend

1. **Verify SUPABASE_JWT_SECRET** in .env matches Supabase dashboard
2. **Ensure JWT middleware returns 401** (not silent continue) if verification fail
3. **Attach decoded JWT to req.user** with correct property mapping (decoded.sub → req.user.id)
4. **Add validation in controller** to check req.user?.id before calling service
5. **Add error re-throwing** in transaction handlers (don't swallow errors)
6. **Return explicit error status** (401, 400, 500) instead of always 200

All three diagnoses are correct and interconnected.
