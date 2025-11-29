# Setup Instructions

## 1. Environment Variables
Rename `.env.local.example` (or just `.env.local` if I created it directly) and fill in your credentials:

- **LiveKit**: Get API Key, Secret, and URL from [LiveKit Cloud](https://cloud.livekit.io/).
- **Supabase**: Get URL and Keys from [Supabase Dashboard](https://supabase.com/).
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Project Settings > API.
  - `SUPABASE_SERVICE_ROLE_KEY`: Found in Project Settings > API (keep this secret!).

## 2. Database Setup
Run the SQL commands in `supabase_schema.sql` in your Supabase SQL Editor to create the necessary tables.

## 3. Run the App
```bash
npm run dev
```

## 4. Testing
1. Go to `http://localhost:3000/invite`.
2. Enter an email (e.g., `test@example.com`).
3. Check the terminal console where you ran `npm run dev`. You will see a "MOCK EMAIL" log with a link.
4. Click the link (or copy-paste it) to join the call.
5. Open the link in another browser/tab to simulate a second user (you might need to generate another invite or just use the same room URL if you want to test quickly, but the flow is designed for unique tokens).

## Notes
- Email sending is mocked. To send real emails, integrate SendGrid or Resend in `src/app/api/invite/route.ts`.
- AI Captioning is currently disabled/not implemented as requested.
