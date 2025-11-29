'use client';

import { useState } from 'react';

export default function InvitePage() {
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          roomName: 'room-' + Math.random().toString(36).substring(7), 
          captionLang: lang 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Invite sent! Check server console for link. (Mock)`);
        setEmail('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to send invite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Send Video Call Invite</h1>
        <form onSubmit={sendInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Invitee Email</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="friend@example.com" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Caption Language (Future)</label>
            <select 
              value={lang} 
              onChange={e => setLang(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
