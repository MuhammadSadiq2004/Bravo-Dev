'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState('Validating invite...');

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
          setStatus(`Invalid invite: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        setStatus('Error validating invite');
      }
    }
    validate();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md">
        <p className="text-lg">{status}</p>
      </div>
    </div>
  );
}
