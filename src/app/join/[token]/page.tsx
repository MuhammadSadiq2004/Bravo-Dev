'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState('Validating invite...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/validate-invite?token=${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setStatus('Invite valid! Joining room...');
          // Redirect to call page with room name
          router.push(`/call/${data.roomName}`);
        } else {
          setIsError(true);
          setStatus(`Invalid invite: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        setIsError(true);
        setStatus('Error validating invite');
      }
    }
    validate();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md text-center relative overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>

        <div className="mb-6 flex justify-center">
          {isError ? (
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30 animate-pulse">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">{isError ? 'Connection Failed' : 'Connecting...'}</h2>
        <p className={`text-sm ${isError ? 'text-red-300' : 'text-gray-400'}`}>{status}</p>

        {isError && (
          <button 
            onClick={() => router.push('/invite')}
            className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-semibold transition border border-white/10"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}
