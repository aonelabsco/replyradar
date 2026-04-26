# replyradar

X reply opportunity finder and reply generator.

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd replyradar
npm install
```

### 2. Set up Firebase

#### Create a project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project (or use an existing one).
2. In the project, go to **Firestore Database** → **Create database**. Choose a region close to you and start in production mode (or test mode for development).

#### Generate a service account key

1. Go to **Project Settings** → **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Open the JSON file and extract these three values:

| Env var | JSON field |
|---|---|
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` (the full value including `-----BEGIN PRIVATE KEY-----` and newlines) |

**Do not commit this JSON file.**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in all values. For `FIREBASE_PRIVATE_KEY`, paste the full private key string from the JSON, keeping it double-quoted so the `\n` sequences are preserved, e.g.:

```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` — enter the password you set in `APP_PASSWORD`.

## Deploying to Vercel

1. Push this repo to GitHub/GitLab.
2. Import the repo in [vercel.com](https://vercel.com).
3. In **Settings → Environment Variables**, add all five variables from `.env.local.example` (`APP_PASSWORD`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and the later-phase keys `ANTHROPIC_API_KEY`, `APIFY_TOKEN`).
4. For `FIREBASE_PRIVATE_KEY` on Vercel, paste the raw private key string exactly as it appears in the JSON (Vercel handles quoting automatically).
5. Deploy.

## Project structure

```
src/
  app/
    (app)/          # Protected routes (require auth cookie)
      page.tsx      # Home / dashboard
      feed/         # Phase 4: tweet feed
      quick/        # Phase 4: single-tweet reply mode
      library/      # Phase 2: content library
    api/
      login/        # POST — validates password, sets cookie
      logout/       # POST — clears cookie
    login/          # Public login page
  components/
    Header.tsx      # Sticky header with nav + logout
  lib/
    firebase.ts     # firebase-admin singleton (server-side only)
    schema.ts       # TypeScript types for all Firestore collections
  middleware.ts     # Password gate — redirects unauthenticated requests to /login
```

## Firestore collections

| Collection | Purpose |
|---|---|
| `myContent` | Your own tweets/articles used as context for generating replies |
| `targetAccounts` | Twitter accounts to fetch tweets from in the feed |
| `tweets` | Cached tweets from target accounts |
| `suggestions` | AI-generated reply suggestions with status tracking |

See `src/lib/schema.ts` for the full TypeScript types.

## Phases

- **Phase 1 (current):** Scaffold, Firebase, auth, route shells
- **Phase 2:** Content library CRUD
- **Phase 3:** Target account management
- **Phase 4:** Tweet fetching (Apify), AI reply generation (Claude), feed UI, quick mode
