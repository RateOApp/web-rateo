'use client';

import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents, SocketSession } from '@/types/socket';

/**
 * The app's single Socket.IO connection.
 *
 * The browser never knows the backend origin from a bundled env var: the
 * origin (and, once the backend ships it, a 10-minute socket ticket) comes
 * from our own `GET /api/auth/socket`, which reads the httpOnly cookie
 * server-side.
 *
 * Two modes, chosen by that response and switched with no code change:
 * - `ticket` present  -> authenticated handshake (`auth: { token }`); the
 *   server joins `user_<id>` itself and authorises every `join_room`.
 * - `ticket === null` -> legacy handshake (production today); the client emits
 *   `join_room user_<id>` after connecting. The server treats repeat joins as
 *   idempotent, so this is safe in both modes and is always emitted.
 */

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** After this many `unauthorized` handshakes we stop retrying, quietly. */
const MAX_UNAUTHORIZED_RETRIES = 3;

let socket: AppSocket | null = null;
/** The user the current socket was opened for; a change forces a reconnect. */
let socketUserId: string | null = null;
/** In-flight `connectSocket` call, so concurrent callers share one connection. */
let pending: Promise<AppSocket | null> | null = null;
let unauthorizedRetries = 0;

/** Rooms this session has asked for; re-emitted after every reconnect. */
const rooms = new Set<string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** `GET /api/auth/socket`. Returns `null` when the session is gone or the call fails. */
async function fetchSession(): Promise<SocketSession | null> {
  try {
    const res = await fetch('/api/auth/socket', { cache: 'no-store' });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (!isRecord(body) || typeof body.url !== 'string' || !body.url) return null;
    return {
      url: body.url,
      ticket: typeof body.ticket === 'string' && body.ticket ? body.ticket : null,
      ...(typeof body.expiresIn === 'number' ? { expiresIn: body.expiresIn } : {}),
    };
  } catch {
    return null;
  }
}

/** The live socket, or `null` before `connectSocket` has resolved. */
export function getSocket(): AppSocket | null {
  return socket;
}

/**
 * Joins a room now (when connected) and remembers it, so the room is re-joined
 * automatically after a reconnect. Idempotent server-side.
 */
export function joinRoom(room: string): void {
  if (!room) return;
  rooms.add(room);
  if (socket?.connected) socket.emit('join_room', room);
}

/** Forgets a room, so a later reconnect does not re-join it. */
export function leaveRoom(room: string): void {
  rooms.delete(room);
}

/**
 * A rejected handshake means the ticket expired (or the backend just turned
 * `SOCKET_REQUIRE_AUTH` on). Fetch a fresh one and try again, up to
 * `MAX_UNAUTHORIZED_RETRIES` times, then give up without noise: everything in
 * the app still works over REST, only live updates are lost.
 */
async function retryWithFreshTicket(instance: AppSocket): Promise<void> {
  const session = await fetchSession();
  // Bail if this socket was replaced or torn down while we were fetching.
  if (instance !== socket) return;
  if (!session) {
    instance.disconnect();
    return;
  }
  instance.auth = session.ticket ? { token: session.ticket } : {};
  instance.connect();
}

/**
 * Opens (or reuses) the connection for `userId`.
 * Resolves to `null` when the ticket endpoint is unreachable - callers must
 * treat a missing socket as "no realtime", never as an error.
 */
export function connectSocket(userId: string): Promise<AppSocket | null> {
  if (!userId) return Promise.resolve(null);
  if (socket && socketUserId === userId) return Promise.resolve(socket);
  if (pending && socketUserId === userId) return pending;

  // A different user (account switch) must never inherit the old connection.
  if (socket) disconnectSocket();

  socketUserId = userId;
  unauthorizedRetries = 0;

  pending = (async () => {
    const session = await fetchSession();
    // `disconnectSocket()` may have run while the ticket was in flight.
    if (!session || socketUserId !== userId) {
      pending = null;
      return null;
    }

    const instance: AppSocket = io(session.url, {
      auth: session.ticket ? { token: session.ticket } : undefined,
      transports: ['websocket'],
      autoConnect: false,
    });

    instance.on('connect', () => {
      unauthorizedRetries = 0;
      // Always emitted: harmless (idempotent) when the server already joined
      // us, and required in legacy mode.
      instance.emit('join_room', `user_${userId}`);
      for (const room of rooms) instance.emit('join_room', room);
    });

    instance.on('connect_error', (error: Error) => {
      if (error.message !== 'unauthorized') return;
      if (unauthorizedRetries >= MAX_UNAUTHORIZED_RETRIES) {
        instance.disconnect();
        return;
      }
      unauthorizedRetries += 1;
      void retryWithFreshTicket(instance);
    });

    socket = instance;
    pending = null;
    instance.connect();
    return instance;
  })();

  return pending;
}

/** Tears the connection down - on logout and when the provider unmounts. */
export function disconnectSocket(): void {
  rooms.clear();
  socketUserId = null;
  pending = null;
  unauthorizedRetries = 0;
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
