# CodeQuest

CodeQuest is a coding RPG built with React, Vite, JavaScript, Node.js, Express, and MongoDB. Players create an account, complete quiz missions, earn XP and coins, maintain streaks, unlock achievements, and continue the same cloud-saved adventure on another device.

## Prerequisites

- Node.js 20.19 or newer
- npm
- A MongoDB Atlas cluster and database user

## Environment setup

Create a frontend `.env` from the tracked example:

```powershell
Copy-Item .env.example .env
```

Frontend variable:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Create `server/.env` from `server/.env.example`:

```powershell
cd server
Copy-Item .env.example .env
```

Backend variables:

```dotenv
PORT=5000
MONGODB_URI=YOUR_MONGODB_ATLAS_URL
JWT_SECRET=YOUR_STRONG_SECRET
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`JWT_EXPIRES_IN` is optional and defaults to `7d`. Real `.env` files are ignored by Git. Never put a MongoDB password or JWT secret in source code.

## Run locally

Backend terminal:

```powershell
cd server
npm install
npm run dev
```

Frontend terminal, from the project root:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. If Vite uses a different port, update `CLIENT_URL` in `server/.env` to that exact origin and restart the backend.

## MongoDB Atlas setup

1. Create an Atlas project and a cluster.
2. Under **Database Access**, create a database user with read/write access to the CodeQuest database. Use a unique password.
3. Under **Network Access**, add the IP address of the machine running the API. Avoid allowing every IP in production.
4. Choose **Connect → Drivers → Node.js** and copy the `mongodb+srv://...` connection string.
5. Replace `<password>` with the database user's password. URL-encode reserved characters in the password, or use an Atlas-generated password without reserved characters.
6. Add a database name, for example: `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/codequest?retryWrites=true&w=majority`.
7. Put the result only in `server/.env` as `MONGODB_URI`.
8. Generate a strong JWT secret, place it only in `server/.env`, then start the backend and frontend with the commands above.

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API and database connection status |
| `POST` | `/api/auth/register` | Public | Create an account, default game data, and JWT |
| `POST` | `/api/auth/login` | Public | Verify credentials and return a JWT |
| `GET` | `/api/auth/me` | Bearer token | Restore and verify the current session |
| `GET` | `/api/player/progress` | Bearer token | Load the authenticated user's game data |
| `PUT` | `/api/player/progress` | Bearer token | Validate and save the authenticated user's game data |

Protected requests use:

```http
Authorization: Bearer TOKEN
```

The server always derives the account ID from the verified JWT. The progress API does not accept a frontend-supplied user ID for account selection.

## Authentication and progress sync

- `AuthContext` owns the JWT, safe user profile, session restoration, login, registration, and logout.
- `GameContext` owns gameplay state and loads MongoDB progress only after authentication succeeds.
- MongoDB is the source of truth for authenticated users.
- Important changes save immediately; ordinary state changes use a short debounce to avoid a request per keystroke or answer-state update.
- Each account also has an isolated local browser cache for temporary offline fallback.
- If cached progress differs from cloud progress, CodeQuest asks which copy to keep instead of overwriting either silently.
- Pre-account `localStorage` progress is offered once with **USE LOCAL PROGRESS** and **START FRESH** choices.
- Logging out removes the local auth session and resets in-memory player state; it does not delete MongoDB progress.

## Security controls

- Passwords are hashed with bcrypt (12 rounds) and are excluded from normal Mongoose queries.
- JWTs contain only `userId` and expire.
- Login failures use the generic message `Invalid email or password`.
- CORS allows only `CLIENT_URL` origins (comma-separated values are supported).
- Progress updates are allowlisted and deeply validated; negative progression values, invalid collections, and hearts above `maxHearts` are rejected.
- `_id`, account email, password, timestamps, and other protected fields cannot be changed through the progress endpoint.
- Request bodies are capped at 512 KB and unsafe object keys are discarded.

## Test two separate users

1. Start the MongoDB-backed API and the frontend.
2. Register User A, complete a mission or change settings, and wait for the navbar to show **Saved**.
3. Log out and register User B with a different email.
4. Confirm User B starts at Level 1, 0 XP, 100 coins, and has no completed missions.
5. Log out, log back in as User A, and confirm User A's earlier progress returns.
6. Refresh the browser and confirm the session and progress remain.
7. Open CodeQuest in another browser, sign in as User A, and confirm the same progress loads.
8. Inspect requests and confirm progress routes contain no user ID parameter; identity comes only from that account's bearer token.

## Quality checks

Frontend:

```powershell
npm run lint
npm run build
```

Backend:

```powershell
cd server
npm run check
npm test
npm audit --omit=dev
```

## Included gameplay systems

- 11 technology worlds, 55 missions, and 11 boss encounters
- 148 local questions across six question formats
- XP thresholds, levels, ranks, coins, hearts, and one-time rewards
- Mission, boss, daily challenge, revision, achievement, skill-tree, analytics, and leaderboard experiences
- Responsive navigation, keyboard-friendly controls, focus-managed dialogs, and reduced-motion support
- Route-level code splitting and versioned local cache recovery

## Project layout

- `src/context/AuthContext.jsx` manages identity and authenticated sessions.
- `src/context/GameContext.jsx` owns gameplay actions, cloud hydration, saving, caching, and migration.
- `src/services/api.js` centralizes API and bearer-token requests.
- `src/services/authService.js` owns safe auth-session storage.
- `src/services/storage.js` validates and isolates browser-cached progress.
- `server/controllers` contains auth and player request handlers.
- `server/middleware` verifies JWTs.
- `server/models` contains the Mongoose user model.
- `server/utils/gameData.js` creates defaults and safely allowlists progress updates.
