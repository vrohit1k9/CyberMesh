# CYBERMESH: Security & Access Control Specification

## 1. Authentication & Token Lifecycle
- **Password Hashing:** Passwords hashed with `bcryptjs` using work factor 10.
- **Session Mechanism:** Stateless JSON Web Tokens (`HS256`) with 8-hour expiry.
- **Token Claims:** `{ userId, username, roleName }`.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Operation | ADMIN | INVESTIGATOR | ANALYST | Public |
|---|:---:|:---:|:---:|:---:|
| User Login (`/api/auth/login`) | ✓ | ✓ | ✓ | ✓ |
| User Provisioning (`/api/auth/register`) | ✓ | ✗ | ✗ | ✗ |
| Ingest Complaint (`POST /api/complaints`) | ✓ | ✓ | ✗ | ✗ |
| View Complaints & Cases | ✓ | ✓ | ✓ | ✗ |
| Update Case Status / Notes | ✓ | ✓ | ✗ | ✗ |
| Traverse Graph Network (`/network`) | ✓ | ✓ | ✓ | ✗ |
| Generate AI Summary | ✓ | ✓ | ✗ | ✗ |
| Recalculate Risk Score | ✓ | ✓ | ✗ | ✗ |
| View Audit Logs | ✓ | ✓ | ✗ | ✗ |

---

## 3. Defensive Mitigations
1. **SQL Injection:** 100% Parameterized queries using prepared statement place-markers (`$1, $2, ...`).
2. **Brute Force Protection:** Express rate limiting (20 attempts per 15 minutes on auth endpoints).
3. **HTTP Header Hardening:** `helmet` for CSP, HSTS, and XSS protection.
4. **Audit Immutability:** Write-only audit log entries recording timestamp, investigator identity, action, and target resource.
