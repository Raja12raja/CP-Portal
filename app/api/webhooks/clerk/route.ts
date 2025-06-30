import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Webhook Received ===');
    await dbConnect();

    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    console.log('Headers:', { svix_id, svix_timestamp, svix_signature: svix_signature ? 'present' : 'missing' });

    // Get the body
    const payload = await request.json();
    console.log('Webhook payload type:', payload.type);
    console.log('Webhook payload data:', JSON.stringify(payload.data, null, 2));

    // If webhook secret is not configured, skip verification for development
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.log('Warning: CLERK_WEBHOOK_SECRET not configured, skipping verification');
    } else {
      // Only verify if secret is configured and headers are present
      if (svix_id && svix_timestamp && svix_signature) {
        try {
          const { Webhook } = await import('svix');
          const wh = new Webhook(webhookSecret);
          const body = JSON.stringify(payload);
          
          // For development, we'll be more lenient with timestamp validation
          const evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
          });
          console.log('Webhook verified successfully');
        } catch (err) {
          console.error('Error verifying webhook:', err);
          
          // In development, continue processing even if verification fails
          if (process.env.NODE_ENV === 'development') {
            console.log('Continuing in development mode despite verification failure');
          } else {
            return new Response('Webhook verification failed', { status: 400 });
          }
        }
      } else {
        console.log('Missing webhook headers, skipping verification');
      }
    }

    // Handle the webhook
    const eventType = payload.type;
    console.log('Processing event type:', eventType);
    
    if (eventType === 'user.created') {
      console.log('=== User Created Event ===');
      const { id, email_addresses, first_name, last_name, username, image_url } = payload.data;
      const email = email_addresses?.[0]?.email_address;

      if (email) {
        const userData = await User.findOneAndUpdate(
          { clerkId: id },
          {
            clerkId: id,
            email,
            firstName: first_name,
            lastName: last_name,
            username,
            imageUrl: image_url,
            friends: [],
            friendRequests: {
              sent: [],
              received: []
            }
          },
          { upsert: true, new: true }
        );
        console.log(`✅ User created in database: ${email}`);
        console.log('User data saved:', userData);
      } else {
        console.log('❌ No email found in user data');
      }
    }

    if (eventType === 'user.updated') {
      console.log('=== User Updated Event ===');
      const { id, email_addresses, first_name, last_name, username, image_url } = payload.data;
      const email = email_addresses?.[0]?.email_address;

      if (email) {
        const userData = await User.findOneAndUpdate(
          { clerkId: id },
          {
            email,
            firstName: first_name,
            lastName: last_name,
            username,
            imageUrl: image_url,
          },
          { new: true }
        );
        console.log(`✅ User updated in database: ${email}`);
        console.log('Updated user data:', userData);
      }
    }

    if (eventType === 'user.deleted') {
      console.log('=== User Deleted Event ===');
      const { id } = payload.data;
      const deletedUser = await User.findOneAndDelete({ clerkId: id });
      console.log(`✅ User deleted from database: ${id}`);
      console.log('Deleted user data:', deletedUser);
    }

    // Handle session events (when user signs in)
    if (eventType === 'session.created') {
      console.log('=== Session Created Event ===');
      const { user_id } = payload.data;
      console.log(`User signed in: ${user_id}`);
      
      // Check if user exists in database, if not create them
      const existingUser = await User.findOne({ clerkId: user_id });
      if (!existingUser) {
        console.log(`User ${user_id} not found in database, creating...`);
        // We'll need to fetch user data from Clerk API or wait for user.created event
        console.log('Note: User will be created when user.created event is received');
      } else {
        console.log(`User ${user_id} already exists in database`);
      }
    }

    console.log('=== Webhook Processed Successfully ===');
    return NextResponse.json({ 
      success: true, 
      eventType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== Webhook Error ===');
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is working',
    status: 'ready',
    timestamp: new Date().toISOString()
  });
} 