import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  // 1. Check if invite exists and is valid
  const { data: invite, error } = await supabaseAdmin
    .from('invites')
    .select('*, rooms(*)')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(invite.expires_at);

  if (now > expiresAt) {
    return NextResponse.json({ valid: false, error: 'Token expired' }, { status: 410 });
  }

  // 2. (Optional) Mark as accepted? 
  // For now, we just validate.

  return NextResponse.json({ 
    valid: true, 
    roomName: invite.rooms.livekit_room_name,
    email: invite.email
  });
}
