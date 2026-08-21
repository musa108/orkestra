import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Reconnects with a fresh token if the previous socket was disconnected
 *  due to an expired one — getWorkflowSocket() is called fresh on every
 *  page that needs it, so this always picks up the current token rather
 *  than one baked in at first connect (previously the token wasn't sent
 *  at all — see workflow.gateway.ts's handleConnection auth check). */
export function getWorkflowSocket(): Socket {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('orkestra_access_token') : null;

  if (socket && socket.connected) return socket;

  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace('/api/v1', '');
  socket = io(`${base}/workflow`, {
    transports: ['websocket'],
    auth: { token },
  });
  return socket;
}
