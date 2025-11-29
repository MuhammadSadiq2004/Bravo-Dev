'use client';

import { useEffect, useState, use } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useRouter, useSearchParams } from 'next/navigation';
import Captions from '@/components/Captions';
import Reactions from '@/components/Reactions';

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Guest';
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [inputName, setInputName] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!name || name === 'Guest') {
      setShowNameInput(true);
      return;
    }

    (async () => {
      try {
        // Use name in identity to make it recognizable but unique
        const identity = `${name}-${Math.random().toString(36).substring(7)}`;
        const resp = await fetch(
          `/api/livekit/token?room=${roomId}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(name)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomId, name]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      // Reload with name param to trigger the token fetch
      router.push(`/call/${roomId}?name=${encodeURIComponent(inputName)}`);
    }
  };

  const copyLink = async () => {
    // Copy only the base URL + path, excluding query params (like ?name=...)
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!token) {
    if (showNameInput) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
            <h2 className="text-2xl font-bold mb-2">Join Call</h2>
            <p className="text-gray-400 text-sm mb-6">Please enter your name to join.</p>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Your Name"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition"
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-gray-300 font-medium">Joining secure room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{
      // Override LiveKit CSS variables for custom theme
      // @ts-expect-error - Custom CSS variables
      '--lk-bg': 'transparent',
      '--lk-control-bar-bg': 'rgba(0, 0, 0, 0.6)',
      '--lk-control-bar-border': 'rgba(255, 255, 255, 0.1)',
      '--lk-accent-bg': '#7c3aed', // Violet 600
      '--lk-accent-fg': '#ffffff',
      '--lk-control-fg': '#e5e7eb',
      '--lk-grid-gap': '1rem',
    }}>
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
        <Captions />
        <Reactions />
        
        {/* Copy Link Button Overlay */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-all"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                <span className="text-sm font-medium">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </LiveKitRoom>
    </div>
  );
}
