
import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import {v4 as uuidv4} from 'uuid';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;


export async function GET(request) {
  try {
    // Parse query parameters
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const roomName = searchParams.get('room');
    const isAdmin = searchParams.get('isAdmin') == 'true' ? true : false;
    const participantIdentity = isAdmin ? 'admin' : uuidv4();


    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not defined');
    }

    const livekitServerUrl = LIVEKIT_URL;
    if (livekitServerUrl === undefined) {
      throw new Error('Invalid region');
    }

    if (typeof roomName !== 'string') {
      return new NextResponse('Missing required query parameter: roomName', { status: 400 });
    }

    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantIdentity,
      },
      roomName,
    );

    // Return connection details
    const data = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantIdentity: participantIdentity,
    };
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo, roomName) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = '5m';
  const grant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canPublishSources: [],
  };
  at.addGrant(grant);
  return at.toJwt();
}