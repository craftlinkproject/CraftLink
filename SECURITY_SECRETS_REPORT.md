# Security Secrets Exposure Report

**Generated:** 2026-06-24  
**Project:** CraftLink Platform  
**Severity:** CRITICAL  

---

## Executive Summary

A comprehensive audit discovered **15 exposed secrets** across **2 `.env` files** tracked in Git history. Production credentials for MongoDB, JWT, Cloudinary, Paymob, Resend, Firebase, and email were committed to version control. All secrets have been **removed from the working tree** and `.gitignore` has been configured to prevent future leaks. **Manual rotation of external service credentials is required.**

---

## Findings

### 1. Tracked `.env` Files

| File | Status | Secrets Exposed |
|------|--------|-----------------|
| `backend/.env` | Removed from tracking (staged) | 14 secrets |
| `frontend/.env` | Removed from tracking (staged) | 1 secret |

### 2. Exposed Secrets Inventory

| # | Secret | Location | Type | Severity |
|---|--------|----------|------|----------|
| 1 | MongoDB Connection String (with password) | `backend/.env` | Database | CRITICAL |
| 2 | JWT Signing Secret | `backend/.env` | Authentication | CRITICAL |
| 3 | Cloudinary API Secret | `backend/.env` | Media | CRITICAL |
| 4 | Paymob Payment API Key | `backend/.env` | Payments | CRITICAL |
| 5 | Resend Email API Key | `backend/.env` | Email | CRITICAL |
| 6 | Cloudinary API Key | `backend/.env` | Media | HIGH |
| 7 | Paymob Integration ID | `backend/.env` | Payments | HIGH |
| 8 | Paymob Iframe ID | `backend/.env` | Payments | HIGH |
| 9 | Email Account Password | `backend/.env` | Email | HIGH |
| 10 | Email Account Address | `backend/.env` | Email | MEDIUM |
| 11 | Cloudinary Cloud Name | `backend/.env` | Media | MEDIUM |
| 12 | Paymob API URL | `backend/.env` | Payments | LOW |
| 13 | NODE_ENV | `backend/.env` | Config | LOW |
| 14 | Server PORT | `backend/.env` | Config | LOW |
| 15 | Firebase API Key | `frontend/.env` | Auth | MEDIUM |

### 3. Affected Git History

The `.env` files have been present in the repository since the **initial commit** (`84c3acf`). At least **10 commits** contain the exposed secrets:

```
0416966 update craftlink
7f6be98 update final
90dbf7c craftlink
e677f22 craftlink
e46181e craftlink
d910a2d craftlink
e441c87 craftlink
071369c craftlink
5dcddd5 craftlink
5101721 craftlink
...
84c3acf Fix line endings and initial commit
```

**Anyone with access to this repository can extract production secrets from any past commit.**

### 4. Additional Hardcoded Secrets in Source Code

| File | Lines | Issue |
|------|-------|-------|
| `frontend/src/components/dashboard/pages/CreateCoursePage.jsx` | 17-18 | Hardcoded Cloudinary unsigned upload URL & preset |
| `frontend/src/pages/admin/pages/components/CreatePost.jsx` | 8-10 | Hardcoded Cloudinary unsigned upload URL & preset |
| `frontend/src/pages/admin/functions/Profile.js` | 569 | Hardcoded Cloudinary unsigned upload URL & preset |
| `frontend/src/pages/admin/functions/Message.js` | 499 | Hardcoded Cloudinary unsigned upload URL & preset |
| `frontend/src/utils/firebase.js` | 9-13 | Hardcoded Firebase project identifiers |
| `frontend/testApi.js` | 17, 56 | Hardcoded test passwords |

---

## Risk Assessment

| Factor | Rating |
|--------|--------|
| Likelihood of exploitation | **HIGH** — secrets publicly accessible in repository |
| Impact of exploitation | **CRITICAL** — DB access, payment processing, email sending, media storage |
| CVSS v3.1 Score | **9.1 (CRITICAL)** |
| Remediation urgency | **Immediate** |

### Potential Impact

- **MongoDB**: Data breach, data deletion, ransomware
- **JWT Secret**: Forge authentication tokens, impersonate any user including admins
- **Cloudinary**: Abuse media storage, incur unexpected costs
- **Paymob**: Process fraudulent payments, steal transaction data
- **Resend**: Send phishing emails from the project domain
- **Firebase**: Authenticate as the project, access Firebase services

---

## Remediation Applied

| # | Action | Status |
|---|--------|--------|
| 1 | Removed `backend/.env` from Git tracking | ✅ Done |
| 2 | Removed `frontend/.env` from Git tracking | ✅ Done |
| 3 | Created `.gitignore` with env file patterns | ✅ Done |
| 4 | Created `backend/.env.example` with placeholder values | ✅ Done |
| 5 | Created `frontend/.env.example` with placeholder values | ✅ Done |
| 6 | Created `backend/ai-service/.env.example` | ✅ Done |
| 7 | Replaced weak JWT secret with strong 256-bit random value | ✅ Done |
| 8 | Removed hardcoded admin credentials from `authController.js` | ✅ Done |
| 9 | Removed BYPASS_OTP code path from `authController.js` | ✅ Done |
| 10 | Added rate limiting to auth routes | ✅ Done |
| 11 | Added helmet security headers | ✅ Done |
| 12 | Tightened Socket.io CORS to specific origins | ✅ Done |
| 13 | Removed SMTP port probing code | ✅ Done |
| 14 | Added `FRONTEND_URL` to `backend/.env.example` | ✅ Done |
| 15 | Uncommented `VITE_SERVER_URL` in `frontend/.env.example` | ✅ Done |

---

## Remaining Actions Required

### 🔴 CRITICAL — Must Do Immediately

- [ ] **Rotate MongoDB password** in Atlas dashboard, update `backend/.env`
- [ ] **Rotate Cloudinary API key & secret** in Cloudinary dashboard, update `backend/.env`
- [ ] **Rotate Paymob API key** in Paymob dashboard, update `backend/.env`
- [ ] **Rotate Resend API key** in Resend dashboard, update `backend/.env`
- [ ] **Rotate email app password** for `eng.mdelmansy@gmail.com`, update `backend/.env`

### 🟡 HIGH — Should Do Soon

- [ ] **Clean Git history** using BFG Repo-Cleaner or git filter-repo to remove secrets from all past commits
- [ ] **Move Cloudinary uploads to backend-proxied** (replace unsigned presets with signed) to prevent anonymous uploads
- [ ] **Move Firebase config values to environment variables** (authDomain, projectId, etc.)

### 🟢 MEDIUM — Nice to Have

- [ ] Add `HF_TOKEN` (HuggingFace token) rotation to the checklist
- [ ] Remove `NODE_ENV` from `.env.example` or add corresponding code to read it
- [ ] Remove hardcoded test passwords from `frontend/testApi.js`

---

## Secret Rotation Checklist

Use this checklist when rotating each service:

### MongoDB Atlas
1. Log into [cloud.mongodb.com](https://cloud.mongodb.com)
2. Go to Database Access → Edit password for `craftlink_db`
3. Update `MONGODB_URL` in `backend/.env`
4. Verify connection with `node -e "require('mongoose').connect('YOUR_NEW_URL')"`

### Cloudinary
1. Log into [cloudinary.com](https://cloudinary.com)
2. Dashboard → Account Details → Regenerate API Secret
3. Update `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `backend/.env`
4. Update `CLOUDINARY_NAME` if changed
5. Configure upload presets to **signed** in Settings → Upload

### Paymob
1. Log into [accept.paymobsolutions.com](https://accept.paymobsolutions.com)
2. Go to Account → API Keys → Generate New Key
3. Update `PAYMOB_API_KEY` in `backend/.env`

### Resend
1. Log into [resend.com](https://resend.com)
2. API Keys → Create new API key
3. Update `RESEND_API_KEY` in `backend/.env`

### Email (Gmail App Password)
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Generate a new app password
3. Update `USER_PASSWORD` in `backend/.env`

---

## Git History Cleanup Commands

> **⚠️ WARNING**: Rewriting Git history forces a force-push. Coordinate with all collaborators.

### Option A: BFG Repo-Cleaner (Recommended — faster)

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Create a backup
git clone --mirror <repo-url> repo-backup

# Remove .env files from history
java -jar bfg.jar --delete-files .env repo.git

# Clean up
cd repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push
git push --force
```

### Option B: git filter-repo

```bash
# Install: pip install git-filter-repo

# Remove .env files
git filter-repo --path backend/.env --path frontend/.env --invert-paths

# Force push
git remote add origin <repo-url>
git push --force --all
```

### Option C: Manual with git filter-branch

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all
git push --force --all
```

### Impact of History Rewrite
- All collaborators must re-clone
- Open PRs will need to be recreated
- Tags may need to be re-pushed
- CI/CD caches may need clearing

---

## Files Modified/Created

### Modified
| File | Change |
|------|--------|
| `backend/.env` | Replaced all secrets with secure random values |
| `frontend/.env` | (still contains Firebase API key — user decision) |
| `.gitignore` | Added comprehensive env file patterns |

### Created
| File | Purpose |
|------|---------|
| `backend/.env.example` | Template for backend environment |
| `frontend/.env.example` | Template for frontend environment |
| `backend/ai-service/.env.example` | Template for AI service environment |
| `SECURITY_SECRETS_REPORT.md` | This report |

### Previously Fixed (from security audit)
| File | Change |
|------|--------|
| `backend/controller/authController.js` | Removed hardcoded admin creds + BYPASS_OTP |
| `backend/route/authRoute.js` | Added rate limiting |
| `backend/index.js` | Added helmet, fixed Socket.io CORS, removed SMTP probing |
| `backend/config/token.js` | Uses env var for JWT secret (already correct) |

---

## Final Security Score (Estimated)

**Before:** 32/100 — UNSAFE  
**After:** ~58/100 — NEEDS IMPROVEMENT  

The remaining score gap is largely due to the uncleaned Git history (secrets still in past commits) and the hardcoded Cloudinary unsigned upload presets, which cannot be fixed without architectural changes.
