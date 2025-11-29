# Frontend.md — LiveKit + Supabase Email Invite (Full)

## Overview

This frontend doc describes a Next.js app (App Router, TypeScript) that:

* Uses **LiveKit** for realtime 1:1 calls.
* Uses **Supabase** as the database (Postgres) and for storing invites, users, and room metadata.
* Sends invitations via **email (SendGrid / SMTP)** — emails contain a secure **magic link** to join the call.
* Displays **real-time captions** (WS/DataChannel) and supports per-user caption language selection and translation.

Key properties:

* Email invites create a temporary join token (expires).
* LiveKit server is hosted on Render (or any VPS).
* Next.js frontend is hosted on Vercel and uses serverless API routes for token creation & invite management.

---

## Tech stack (frontend)

* Next.js (App Router) + TypeScript
* LiveKit Client SDK (`livekit-client` and `livekit-react` optional)
* Supabase JS (`@supabase/supabase-js`) for DB + auth (optional)
* Tailwind CSS for styling
* Socket.IO or LiveKit DataChannel for captions (we recommend LiveKit DataChannel)

---

## Database (Supabase) — Schema (SQL)

Run this on your Supabase SQL editor:

```sql
-- users table (optional, if you want persistent user profiles)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  livekit_room_name text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

-- invites table
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  email text not null,
  token text not null, -- secure random token
  expires_at timestamptz not null,
  accepted boolean default false,
  created_at timestamptz default now()
);

-- captions log (optional, for analytics / debugging)
create table if not exists captions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  invite_id uuid references invites(id) on delete set null,
  speaker_identity text,
  src_language text,
  tgt_language text,
  text text,
  is_final boolean,
  created_at timestamptz default now()
);
```

Notes:

* `token` should be securely random (use `crypto.randomBytes(32).toString('hex')` in Node).
* `expires_at` typically set to e.g., `now() + interval '12 hours'` or configurable.

---

## Frontend Routes / Pages

```
/app
  /invite (page)            -- create invite modal (enter email, choose caption language)
  /call/[roomId]/page.tsx   -- call page (LiveKit connect + captions overlay)
  /join/[token]/page.tsx    -- magic link landing page (validate token, redirect to /call/[roomId])
  /components
    InviteModal.tsx
    CaptionsOverlay.tsx
    VideoView.tsx
  /lib
    supabaseClient.ts
    livekitClient.ts
```

---

## Example: Invite Flow (Frontend)

1. Host opens `invite` page, enters invitee email + optional caption language.
2. Frontend calls `/api/invite` with `{ email, roomName, captionLang }`.
3. Backend creates `rooms` and `invites` rows (if new), generates `token`, stores it in Supabase, and sends email containing `https://yourapp.com/join/{token}`.
4. Invitee clicks magic link → goes to `/join/[token]`. Frontend calls `/api/validate-invite?token=...` to ensure token valid.
5. If valid, backend marks invite valid (or just returns roomId + short-lived LiveKit join token).
6. Frontend requests LiveKit **join token** from `/api/livekit/token?room={roomName}&identity={identity}` and connects.

---

## Sample frontend invite UI (React + TypeScript)

```tsx
// components/InviteModal.tsx (simplified)
import { useState } from 'react';

export default function InviteModal({ roomId }: { roomId?: string }) {
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  async function sendInvite() {
    setLoading(true);
    await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, roomName: roomId || 'room-'+Date.now(), captionLang: lang }),
    });
    setLoading(false);
    alert('Invite sent');
  }

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="invitee@example.com" />
      <select value={lang} onChange={e => setLang(e.target.value)}>
        <option value="en">English</option>
        <option value="ur">Urdu</option>
        <option value="es">Spanish</option>
      </select>
      <button onClick={sendInvite} disabled={loading}>Send Invite</button>
    </div>
  )
}
```

---

## Call Page (connect + captions)

Key points:

* Call page receives `roomId` path param.
* Calls `/api/livekit/token` to get LiveKit join token.
* Connects using LiveKit `Room.connect(url, token)`.
* Publishes local tracks and subscribes to remote.
* Uses LiveKit DataChannel to receive caption events.

```tsx
// app/call/[roomId]/page.tsx (simplified)
import { useEffect, useState } from 'react';
import { Room } from 'livekit-client';
import CaptionsOverlay from '../../components/CaptionsOverlay';

export default function CallPage({ params }: { params: { roomId: string }}){
  const [room, setRoom] = useState<Room | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);

  useEffect(() => {
    async function start() {
      const res = await fetch(`/api/livekit/token?room=${params.roomId}&identity=user-${Date.now()}`);
      const { token, url } = await res.json();
      const r = new Room();
      await r.connect(url, token);
      await r.localParticipant.publishTrack(await LocalVideoTrack.create());

      r.on('dataReceived', (pkt, participant) => {
        // pkt.data is Uint8Array
        const msg = new TextDecoder().decode(pkt.data);
        const obj = JSON.parse(msg);
        setCaptions(c => [...c, obj.text]);
      });

      setRoom(r);
    }
    start();
    return () => { room?.disconnect(); }
  }, [params.roomId]);

  return (
    <div className="call-page">
      {/* Video views */}
      <CaptionsOverlay captions={captions} />
    </div>
  );
}
```

Notes:

* Use the `livekit-react` components if you'd like prebuilt UI.
* The `dataReceived` event is a convenient wrapper for data channels.

---

## Captions Overlay (component)

```tsx
export default function CaptionsOverlay({ captions }: { captions: string[] }){
  const last = captions.length ? captions[captions.length - 1] : '';
  return (
    <div className="absolute bottom-6 w-full text-center">
      <div className="inline-block bg-black/60 text-white p-2 rounded">{last}</div>
    </div>
  );
}
```

---

## Security on client

* Do not store LiveKit server API secret on frontend — only create join tokens on backend.
* Validate invite token on server before issuing LiveKit join tokens for that invite.
* Use short-lived LiveKit tokens (default behavior).

---
