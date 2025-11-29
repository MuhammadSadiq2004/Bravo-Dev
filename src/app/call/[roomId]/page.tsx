'use client';

import { useEffect, useState, use } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useRouter } from 'next/navigation';

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const identity = `user-${Math.random().toString(36).substring(7)}`;
        const resp = await fetch(
          `/api/livekit/token?room=${roomId}&identity=${identity}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading room...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: '100vh' }}
      onDisconnected={() => router.push('/invite')}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
