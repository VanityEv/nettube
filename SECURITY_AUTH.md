# Authentication & Token Security

## Overview
This document describes the hardened authentication design now implemented.

## Token Types
- **Access Token**: Short‑lived (15m) JWT. Sent only in the `Authorization: Bearer <token>` header. Never stored in cookies/localStorage; kept in memory (Redux / React state) to reduce XSS impact.
- **Refresh Token**: Long‑lived (30d) opaque JWT (or random string) whose **hash** is stored in DB (`refresh_tokens` table). Delivered via `Set-Cookie` as `HttpOnly; Secure; SameSite=Strict; Path=/user/refresh`. Rotated on every refresh.
- **Verification Temp Token**: 15m (already existed) used only for device / 2FA flow.
- **Password Reset Token**: 30m; single‑use.
- **Streaming Token**: 1h; scoped (`tokenType: stream`, `videoId`).

## JWT Payload (Access)
```
{
  sub: <userId>,
  username: <username>,
  account_type: <role>,
  tokenType: 'access',
  jti: <uuid>,
  iat, exp
}
```
Constraints: reject tokens missing `tokenType==='access'`.

## Refresh Flow
1. Login success → issue access + refresh. Store refresh hash.
2. Client stores access token in memory; server sets refresh cookie.
3. When access expires (401 with reason), client calls `/user/refresh`.
4. Server validates cookie, DB record, expiry, revocation, fingerprint; issues new pair, rotates: marks old `revoked_at` & `replaced_by`.
5. Logout → revoke current refresh (set `revoked_at`, clear cookie).
6. Global logout → revoke all user refresh tokens.

## Security Controls
| Threat | Mitigation |
|--------|------------|
| XSS token theft | No persistent access token; refresh cookie httpOnly+SameSite=Strict |
| Stolen refresh token | Stored hashed, bound to fingerprint + user agent + IP (optional); rotation + revocation |
| Replay of old refresh | `revoked_at` + `replaced_by` chain validation |
| Privilege escalation | `account_type` enforced server-side; verifyToken attaches `req.user` from JWT only after signature + claims validation |
| CSRF | Sensitive endpoints require bearer header; refresh endpoint limited path & SameSite=Strict |
| Token confusion | `tokenType` claim enforced; streaming tokens scoped with `type: 'stream'` |
| Infinite sessions | Access 15m, refresh 30d max, absolute max lifetime tracking optional |

## Database: `RefreshToken` Model
See `prisma/schema.prisma` `RefreshToken` with hashed token storage.

## Revocation Strategy
- Single: set `revoked_at` for one token.
- Rotation: old token immediately revoked, `replaced_by` references new jti.
- Compromise detection: if a **used** refresh already has `revoked_at` or `replaced_by` not matching presented chain → revoke all.

## Implementation Notes
- Use `crypto.randomBytes(64)` for raw refresh token (if not JWT). Store `sha256` hash (hex).
- Always compare with timing‑safe equality.
- Set strict CORS to allow credentials for refresh path only.
- Ensure `JWT_SECRET` ≥ 32 bytes; rotate with overlapping validity if needed.

## Logout Endpoints
- `POST /user/logout` → revoke current refresh & clear cookie.
- `POST /user/logoutAll` → revoke all refresh tokens for user & clear cookie.

## Claim Validation
`verifyToken` must also assert:
- `tokenType === 'access'`
- `exp` present and in future
- Allowed algorithms list `["HS256"]`

## Future Enhancements
- Device management UI listing active refresh tokens.
- Absolute session lifetime cap (e.g., 7d even with rotation).
- Anomaly detection (geo / ASN change) to force re-auth.

## Frontend Changes
- Remove `typescript-cookie` usage for auth tokens; only store `userAccountType` if needed (or derive from access token payload decoded locally – avoid trust).
- Interceptor to catch 401 & call `/user/refresh`; if fails → force sign in.

## Testing Checklist
- Access token expired → refresh works → new jti.
- Old refresh token reused → triggers global revocation.
- XSS simulation cannot read refresh cookie.
- CSRF attempt (img tag to refresh) blocked (no Authorization for protected endpoints; SameSite prevents sending in cross-site context).

---
This file should be updated if authentication logic changes.
