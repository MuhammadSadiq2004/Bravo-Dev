import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emails, roomName } = body; // Expect emails array

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required' }, { status: 400 });
    }

    const livekitRoomName = roomName || `room-${Date.now()}`;
    
    // 1. Create Room in Supabase (Once)
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

    // Setup Transporter (Once)
    let transporter: nodemailer.Transporter | null = null;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT) || 465;
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // 2. Process each email
    const results = [];
    for (const email of emails) {
        if (!email.trim()) continue;

        // Create Invite Token
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
            console.error(`Error creating invite for ${email}:`, inviteError);
            results.push({ email, status: 'failed', error: 'Database error' });
            continue;
        }

        // 3. Send Email
        const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${token}`;
        
        if (transporter) {
            try {
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
                results.push({ email, status: 'sent' });
            } catch (err) {
                console.error(`Failed to send email to ${email}`, err);
                results.push({ email, status: 'failed', error: 'Email send error' });
            }
        } else {
            console.log('---------------------------------------------------');
            console.log('SMTP NOT CONFIGURED. LOGGING EMAIL INSTEAD.');
            console.log(`MOCK EMAIL TO: ${email}`);
            console.log(`LINK: ${joinUrl}`);
            console.log('---------------------------------------------------');
            results.push({ email, status: 'mock-sent' });
        }
    }

    return NextResponse.json({ success: true, roomId: roomData.id, results });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
