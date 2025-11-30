import { IngressClient, IngressInput, IngressAudioOptions } from 'livekit-server-sdk';

const ingressClient = new IngressClient(
  'https://interview-nxkp6sn9.livekit.cloud',
  'APIjUmJuRYvXa2W', 
  'SL8ZNCWAOamwXKxcCI3bt2I3Ti1AK1iUcRoDSWFxnCB'
);

try {
  // Ek bar create karo - permanent rahega
  const ingress = await ingressClient.createIngress(IngressInput.RTMP_INPUT,{
    name: 'Tone Player Bot',
    roomName: '655347b59c00a7409d9181c3',
    participantName: 'Tone Player Bot',
    participantIdentity: 'tone-player-bot',
  });

  // Ye credentials save kar lo - hamesha same rahenge
  console.log('RTMP URL:', ingress.url);
  console.log('Stream Key:', ingress.streamKey);
  console.log('Ingress ID:', ingress.ingressId);
} catch (error) {
  console.error('Error creating ingress:', error);
}