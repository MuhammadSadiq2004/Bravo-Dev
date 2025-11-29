'use client';

import { useEffect, useState, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

// Define the interface for the Web Speech API
interface IWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SpeechRecognition: any;
}

export default function Captions() {
  const room = useRoomContext();
  const [captions, setCaptions] = useState<{ identity: string; text: string }[]>([]);
  const [targetLang, setTargetLang] = useState<string>('en'); // Default to English (no translation if source is en)
  
  // Refs for cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Helper to translate text
  const translateText = async (text: string, target: string) => {
    if (target === 'en') return text; // Assuming source is English for now
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`);
      const data = await res.json();
      return data.responseData.translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    }
  };

  // 1. Handle Incoming Captions (from other users via DataChannel)
  useEffect(() => {
    if (!room) return;

    const handleData = async (payload: Uint8Array, participant?: RemoteParticipant) => {
      const str = new TextDecoder().decode(payload);
      try {
        const data = JSON.parse(str);
        if (data.type === 'caption') {
          const identity = participant?.identity || 'Unknown';
          
          // 1. Show original text immediately (for speed)
          setCaptions((prev) => {
            const newCaps = [...prev];
            // If the last caption is from the same user and is interim (we assume interim if we are updating it), replace it
            // But since we don't track isFinal in state easily, we'll just append if it's a new final, or replace if it's interim.
            // Simplified strategy: If the last caption is from this user, replace it.
            if (newCaps.length > 0 && newCaps[newCaps.length - 1].identity === identity) {
               newCaps[newCaps.length - 1].text = data.text;
               return newCaps;
            }
            return [...prev, { identity, text: data.text }].slice(-3);
          });

          // 2. If it's a final result, translate it in the background and update
          if (data.isFinal && targetLang !== 'en') {
             translateText(data.text, targetLang).then(translated => {
                setCaptions((prev) => {
                    const newCaps = [...prev];
                    // Find the last caption from this user and update it
                    // This is a bit loose but works for sequential speech
                    for (let i = newCaps.length - 1; i >= 0; i--) {
                        if (newCaps[i].identity === identity) {
                            newCaps[i].text = translated;
                            break;
                        }
                    }
                    return [...newCaps];
                });
             });
          }
        }
      } catch {
        // ignore non-json
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, targetLang]); // Re-run when targetLang changes

  // 2. Handle Local Speech-to-Text (Google Web Speech API)
  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.error('Browser does not support speech recognition.');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true; // Keep listening even after the user pauses
    recognition.interimResults = true; // Show results while speaking
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      
      if (text.trim()) {
        // 1. Show locally immediately (Optimistic UI)
        setCaptions((prev) => {
           const newCaps = [...prev];
           if (newCaps.length > 0 && newCaps[newCaps.length - 1].identity === 'Me') {
             newCaps[newCaps.length - 1].text = text;
             return newCaps;
           } else {
             return [...prev, { identity: 'Me', text: text }].slice(-3);
           }
        });

        // 2. If final, translate locally and update
        if (finalTranscript && targetLang !== 'en') {
            translateText(finalTranscript, targetLang).then(translated => {
                setCaptions((prev) => {
                    const newCaps = [...prev];
                    if (newCaps.length > 0 && newCaps[newCaps.length - 1].identity === 'Me') {
                        newCaps[newCaps.length - 1].text = translated;
                    }
                    return [...newCaps];
                });
            });
        }

        // 3. Broadcast to room
        // Send BOTH interim and final results so others see it in real-time
        if (room && room.localParticipant) {
           const isFinal = !!finalTranscript;
           const msg = JSON.stringify({ 
               type: 'caption', 
               text: text, 
               isFinal: isFinal 
           });
           const encoder = new TextEncoder();
           room.localParticipant.publishData(encoder.encode(msg), { reliable: isFinal }); // Reliable only for final

           // Restart recognition to prevent freezing (common Web Speech API bug)
           if (isFinal) {
               recognition.stop();
           }
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      // Restart if it stops unexpectedly (continuous mode sometimes stops)
      // Short delay to avoid rapid loops but minimize downtime
      setTimeout(() => {
        try {
            recognition.start();
        } catch {
            // ignore if already started
        }
      }, 100);
    };

    try {
        recognition.start();
    } catch (e) {
        console.error(e);
    }

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart
        recognitionRef.current.stop();
      }
    };
  }, [room, targetLang]); // Re-run when targetLang changes

  return (
    <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center pointer-events-none z-50">
      {/* Language Selector */}
      <div className="pointer-events-auto mb-4">
        <select 
          value={targetLang} 
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-black/60 text-white border border-white/20 rounded-lg px-3 py-1 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="en">English (Original)</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      {captions.map((cap, i) => (
        <div key={i} className="bg-black/40 backdrop-blur-md border border-white/10 text-white px-6 py-3 rounded-2xl mb-3 max-w-2xl text-center shadow-lg transition-all duration-300">
          <span className="font-bold text-purple-400 mr-2">{cap.identity}:</span>
          <span className="text-gray-100">{cap.text}</span>
        </div>
      ))}
    </div>
  );
}
