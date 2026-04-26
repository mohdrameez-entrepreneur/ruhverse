# AGENTS.md — Ruhverse Project Instructions

## 📌 Project Overview
- **Name**: Ruhverse
- **Description**: A web-based project built with Node.js, HTML, CSS, and JavaScript.
- **Package Manager**: npm

---

## 🧱 Tech Stack
- **Runtime**: Node.js
- **Frontend**: HTML, CSS, JavaScript (TypeScript if present — support both)
- **Package Manager**: npm
- **Language Rule**: If `.ts` files exist in the repo, treat the project as TypeScript.
  If only `.js` files exist, treat it as plain JavaScript. Never mix both in the same file.

---

## 🔒 SECURITY & SAFETY — TOP PRIORITY

> ⚠️ These rules are STRICT and must NEVER be skipped or bypassed under any circumstance.

### ❌ NEVER touch these files/folders WITHOUT explicit user permission each time:
- `.env` / `.env.*` (any environment variable files)
- `config/` or any file named `config.js`, `config.ts`, `config.json`
- Any file related to **authentication** or **authorization**
  (e.g., `auth.js`, `login.js`, `middleware/auth.*`, `jwt.*`, `passport.*`)
- Any file related to **database schema or migrations**
  (e.g., `schema.sql`, `migrations/`, `models/`)
- `package-lock.json` — never manually edit this file
- `.htaccess`, `nginx.conf`, or any server configuration files
- Any file containing **API keys, secrets, tokens, or credentials**
- `firewall`, `cors`, `helmet`, or **security middleware** configuration files

### 🔐 Security Rules — Always Follow:
- NEVER hardcode secrets, API keys, passwords, or tokens directly in code.
  Always use `process.env.VARIABLE_NAME` instead.
- NEVER disable or bypass CORS, Helmet, rate-limiting, or other security middleware.
- NEVER expose internal error messages directly to the client/user.
  Always use generic error messages on the frontend.
- NEVER use `eval()`, `innerHTML` with unsanitized input, or any code that risks XSS.
- NEVER allow SQL or NoSQL injection risks — always use parameterized queries or an ORM.
- Always validate and sanitize ALL user input before processing.
- Always use HTTPS-safe patterns and never suggest HTTP-only for production.
- If a change touches any security-sensitive area, STOP and ask the user first.

---

## 📦 Dependencies

- **ALWAYS ask the user before installing any new npm package.**
- Prefer packages that are:
  - Actively maintained (recent commits on GitHub)
  - Widely used and trusted by the community
  - Free and open-source (no paid/proprietary packages)
  - Lightweight — avoid heavy packages when a smaller alternative exists
- NEVER install a package that is deprecated or has known critical vulnerabilities.
- After suggesting a new package, always explain:
  - What it does
  - Why it is needed
  - Whether a built-in Node.js alternative exists

---

## 🗂️ Folder & Code Conventions
- Keep frontend files (HTML, CSS, JS) organized in a `public/` or `client/` folder.
- Keep backend/server files in `src/` or `server/` folder.
- Use `camelCase` for variables and functions.
- Use `PascalCase` for classes and constructors.
- Use `UPPER_SNAKE_CASE` for constants and environment variable names.
- Keep functions small and single-purpose.
- Always handle errors explicitly — no silent failures, no empty catch blocks.
- Always add clear and concise comments for non-obvious logic only.
- Never leave `console.log` debug statements in production-ready code.
- Use `const` by default. Use `let` only when reassignment is needed. Never use `var`.

---

## ✅ Testing & Verification

- **Test command**: `npm test`
- **Install dependencies**: `npm install`
- **Start project**: `npm start`

### Done-When Checklist (task is only complete when ALL of these are true):
- [ ] `npm test` passes with no failures
- [ ] `npm install` runs cleanly with no errors or vulnerabilities flagged
- [ ] No hardcoded secrets or credentials anywhere in the code
- [ ] No new dependencies added without user approval
- [ ] Security-sensitive files were NOT modified (unless explicitly approved)
- [ ] All user inputs are validated and sanitized
- [ ] No broken HTML, CSS, or JavaScript errors in the browser console
- [ ] The feature/fix works exactly as described — no extra or unrequested changes

---

## 🚫 General Hard Rules
- Do NOT add unrequested features, UI changes, animations, or components.
- Do NOT refactor code unless the user specifically asks for it.
- Do NOT change the database, schema, or data structure without permission.
- Do NOT modify any authentication or session logic without explicit approval.
- Do NOT make assumptions about missing API keys — always ask the user.
- Always implement EXACTLY what is asked — nothing more, nothing less.
- If a task is ambiguous or touches a sensitive area, STOP and ask before proceeding.

---

## 💬 Communication Style
- Be concise. No filler phrases like "Great question!" or "Of course!".
- For simple tasks: give a short answer (2–4 sentences max).
- For complex tasks: give a brief plan, then implement.
- Always explain WHY a security rule is being applied when relevant.
- If something is risky or potentially breaking, warn the user clearly before doing it.

## 🔍 Bug Hunting Rules (When Location is Unknown)
- When the user doesn't know where a bug is, FIRST investigate and
  report findings BEFORE making any changes.
- List ALL files you plan to modify and explain WHY before touching them.
- Make ONE change at a time. After each change, ask the user to test.
- NEVER make sweeping changes across multiple files to fix one bug.
- If the bug is in or near a sensitive file (auth, config, .env),
  STOP and ask the user before doing anything.
- Always explain the bug in plain English — no jargon.