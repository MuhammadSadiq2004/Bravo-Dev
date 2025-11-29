'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

const REACTION_DURATION = 3000; // ms

type Reaction = {
  id: string;
  emoji: string;
  left: number; // random horizontal position %
  delay: number; // random delay for natural feel
};

const PRESET_EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🎉', '🔥', '👋'];

export default function Reactions() {
  const room = useRoomContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const addReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).substring(7);
    const left = Math.random() * 80 + 10; // 10% to 90%
    const delay = Math.random() * 0.5; // Slight random delay
    
    setReactions((prev) => [...prev, { id, emoji, left, delay }]);

    // Remove after animation
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, REACTION_DURATION);
  }, []);

  // Handle incoming reactions
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      const str = new TextDecoder().decode(payload);
      try {
        const data = JSON.parse(str);
        if (data.type === 'reaction') {
          addReaction(data.emoji);
        }
      } catch {
        // ignore
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, addReaction]);

  const sendReaction = async (emoji: string) => {
    // Show locally
    addReaction(emoji);
    setShowPicker(false);

    // Broadcast
    if (room && room.localParticipant) {
      const msg = JSON.stringify({ type: 'reaction', emoji });
      const encoder = new TextEncoder();
      await room.localParticipant.publishData(encoder.encode(msg), { 
        reliable: true,
      });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {/* Floating Emojis */}
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-24 text-5xl animate-float-up"
          style={{ 
            left: `${r.left}%`,
            animationDelay: `${r.delay}s`
          }}
        >
          {r.emoji}
        </div>
      ))}

      {/* Emoji Picker Button */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="relative">
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-4 bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-2">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-white/10 rounded-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={`bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all ${showPicker ? 'bg-purple-600/50 border-purple-500/50' : ''}`}
            title="Send Reaction"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
