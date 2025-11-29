import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, roomName, captionLang } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const livekitRoomName = roomName || `room-${Date.now()}`;
    
    // 1. Create Room in Supabase
    const { data: roomData, error: roomError } = await supabaseAdmin
      .from('rooms')
      .insert({
        room_name: livekitRoomName,
        livekit_room_name: livekitRoomName,
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    // 2. Create Invite Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours

    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('invites')
      .insert({
        room_id: roomData.id,
        email,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // 3. Send Email (Mock)
    const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${token}`;
    console.log('---------------------------------------------------');
    console.log(`MOCK EMAIL TO: ${email}`);
    console.log(`SUBJECT: You are invited to join a video call`);
    console.log(`LINK: ${joinUrl}`);
    console.log('---------------------------------------------------');

    return NextResponse.json({ success: true, roomId: roomData.id, joinUrl });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
