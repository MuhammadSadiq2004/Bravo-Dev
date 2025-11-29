import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, roomName } = body;

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

    const { error: inviteError } = await supabaseAdmin
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

    // 3. Send Email
    const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${token}`;
    
    // Check if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Video Call App" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'You are invited to join a video call',
        text: `You have been invited to a video call. Click the link to join: ${joinUrl}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Video Call Invitation</h2>
            <p>You have been invited to join a secure video call.</p>
            <p>
              <a href="${joinUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Join Call
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Or copy this link: ${joinUrl}
            </p>
          </div>
        `,
      });
      console.log(`Email sent to ${email}`);
    } else {
      console.log('---------------------------------------------------');
      console.log('SMTP NOT CONFIGURED. LOGGING EMAIL INSTEAD.');
      console.log(`MOCK EMAIL TO: ${email}`);
      console.log(`SUBJECT: You are invited to join a video call`);
      console.log(`LINK: ${joinUrl}`);
      console.log('---------------------------------------------------');
    }

    return NextResponse.json({ success: true, roomId: roomData.id, joinUrl });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
