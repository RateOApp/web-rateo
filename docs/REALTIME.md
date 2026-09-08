# Realtime (Phase 6) — messaging, support chat, socket auth

## Current server contract (server-rateo `src/index.js`, no auth today)

- Socket.IO default path `/socket.io/`, `cors.origin: '*'`. Client events: `join_room(room)`,
  `typing({ room, senderId })`, `stop_typing({ room, senderId })`, legacy `send_message`.
- Rooms: personal `user_<userId>`, pair room `[a, b].sort().join('_')`, `admins`.
- Server emits: `receive_message` (pair room, populated Message), `new_message_notification`
  (`user_<receiver>` and `user_<sender>`, Message), `messages_read` (pair, `{ reader, sender }`),
  `message_updated` (pair, `{ type: 'edit'|'react', message }` or `{ type: 'delete', messageId }`),
  `notification` (`user_<id>`, Notification), `user_blocked` / `user_unblocked` (`user_<both>`,
  `{ blockedBy, blockedUser }` / `{ unblockedBy, unblockedUser }`), `account_status_changed`
  (`user_<id>`, `{ userId, isActive, reason }`), `kyc_updated` (`user_<id>`, `{ userId, role,
  kyc: { status }, message, at }`), `problem_report_message` (`admins` + `user_<owner>`,
  `{ reportId, message: { senderRole, text, createdAt } }`), `problem_report_status_updated`
  (`{ reportId, status: 'Open'|'Resolved' }`), `problem_report_changed` (admins only).

## Server changes (server-rateo) — backward compatible, env-gated

1. `POST /api/auth/socket-ticket` (protect) → `{ ticket, expiresIn: 600 }` where ticket =
   `jwt.sign({ id, scope: 'socket' }, JWT_SECRET, { expiresIn: '10m' })`. `protect` and
   `adminProtect` must reject tokens whose `scope === 'socket'` (a ticket is never a REST token).
2. Handshake middleware `io.use(...)`: read `socket.handshake.auth.token` (fallback
   `handshake.query.token`). If present: verify; resolve `User` (not deleted, not suspended) or
   `Admin`; set `socket.data.auth = { kind: 'user'|'admin', id }`; auto-join `user_<id>` (users)
   or `admins` (admins). Invalid token → `next(new Error('unauthorized'))`. If absent: when
   `SOCKET_REQUIRE_AUTH=true` reject, else allow as legacy (`socket.data.auth = null`).
3. Room authorization in `join_room`: authenticated users may join only `user_<own id>` and
   pair rooms containing their own id; admins may join `admins` and anything; unauthenticated
   legacy sockets keep today's behaviour unless `SOCKET_REQUIRE_AUTH=true`. `typing` /
   `stop_typing` from authenticated sockets require membership of `data.room`.
4. CORS: env `CORS_ORIGINS` (comma-separated). When set, both Express `cors()` and the Socket.IO
   `cors.origin` accept only listed origins plus requests with no `Origin` header (native apps,
   curl, server-to-server). When unset, keep the open behaviour. Production value:
   `https://app.rateo.ng,https://admin.rateo.ng`.
5. Message events: populate `sender`/`receiver` before emitting on edit and react; on delete
   emit `{ type: 'delete', messageId, message }` (add the doc; keep `messageId`).
6. Document in `docs/SOCKETS.md` and `.env.production.example`.

Mobile and admin follow-ups (not in this repo): send `auth: { token }` in `io()` options and
then set `SOCKET_REQUIRE_AUTH=true`.

## Web client

- `GET /api/auth/socket` (own route handler, cookie auth): calls backend `POST auth/socket-ticket`;
  returns `{ url, ticket, expiresIn }` where `url` = server env `SOCKET_URL` (default =
  `API_BASE_URL` without the trailing `/api`). No `NEXT_PUBLIC_` backend URL. If the backend
  answers 404 (ticket endpoint not deployed yet) return `{ url, ticket: null }` and the client
  connects in legacy mode (no auth, emits `join_room user_<id>` itself).
- `src/lib/socket.ts`: singleton `io(url, { auth: ticket ? { token: ticket } : undefined,
  transports: ['websocket'], autoConnect: false })`; on `connect_error` with message
  `unauthorized` fetch a new ticket and reconnect (max 3 tries, then give up quietly).
  Always emit `join_room user_<id>` after `connect` (idempotent server-side).
- `SocketProvider` (mounted in `DashboardProviders`): connects when a user exists, disconnects on
  unmount/logout; `useSocket()` → `Socket | null`; `useSocketEvent(name, handler)` helper.
- Global listeners (provider): `notification` → invalidate `['notifications']`;
  `new_message_notification` → invalidate `['conversations']`, `['unreadMessages']`, toast
  "New message from {name}" when not on that thread; `kyc_updated` → invalidate `['me']`,
  `router.refresh()`, toast (**Verified 🎉** / **Verification update** + server `message`);
  `account_status_changed` with `isActive === false` for me → dialog **Account Suspended** /
  **Your account has been suspended by an administrator. Contact support if you think this is a
  mistake.** → **Log out**; `user_blocked` / `user_unblocked` → invalidate `['chatProfile']`,
  `['messages', otherId]`.

### Messages `/dashboard/messages` (both roles)
`GET /messages/conversations` → `[{ user: { _id, firstName, lastName, avatar, companyName, role },
lastMessage, unreadCount }]`. Row: avatar/initials, name (`companyName || first last`), preview
(`lastMessage.content` or **Photo** when only attachments), date, unread badge. Search
**Search for companies** (client filter). KYC gate on opening a thread (KycRequiredDialog).
Empty **No messages yet**. `?user=<id>` → redirect to `/dashboard/messages/<id>`. Desktop:
two-pane layout (list 360px + thread); mobile: list page and thread page. Header messages icon
with unread badge from `GET /messages/unread-count` (`['unreadMessages']`, refetch on
`new_message_notification`), 99+ cap, both roles.

### Thread `/dashboard/messages/[userId]`
- `GET /messages/:userId` → Message[] ascending. Other user from the conversation list or
  `GET /users/:id`. Header: avatar, name, menu → profile sheet.
- Bubbles: own right (brand-700 bg, white text), theirs left (white). Reply quote (sender name
  + `replyTo.content` or **Message unavailable**), image attachments (open full size), deleted
  → italic **Message deleted**, meta `time · Edited · Sent|Read` (own only), reactions chips
  grouped by emoji with counts, date separators by day.
- Composer: textarea **Type a message...**, image attach (`POST /messages/upload` field `image`
  → `{ url }`), reply banner **Replying to {name}** / **Replying to Yourself**, edit banner
  **Editing message...**. Send `POST /messages { receiverId, content, replyTo, attachments }`
  with optimistic bubble (**Sending**, **Failed** on error, retry on click). Enter sends,
  Shift+Enter newline.
- Actions (hover menu / long-press): React (❤️ 😂 😮 😢 👍 👎 → `POST /messages/:id/react`),
  Reply, Edit (own, `PUT /messages/:id`), Delete (own, confirm **Are you sure you want to delete
  this message?** → `DELETE`), Copy, Report (theirs: dialog **Please provide a reason for
  reporting this message.**, **Reason (e.g. Harassment, Spam)**, **Additional details
  (optional)** → `POST /messages/:id/report` → **Message reported successfully**).
- Read: `PUT /messages/read/:userId` on open and on each incoming message while open.
- Sockets: join pair room; `receive_message` (append/replace optimistic by content+sender),
  `message_updated` (edit/react → replace; delete → mark deleted by `messageId`), `messages_read`
  (`reader === other` → mark own as Read), `typing`/`stop_typing` (`senderId === other` → show
  **Typing...**); emit `typing` on keystroke (once per 2 s window) and `stop_typing` after 2 s
  idle or on send.
- Blocked: banner replaces composer: **You have blocked this user. Unblock to send messages.** /
  **You have been blocked by this user.** Block state from `GET /users/:me/full` `blockedUsers`
  and 403 messages from send.

### Chat profile (sheet from the thread header)
`GET /users/:id/full` (or `/users/:id`): avatar, name, **Company**/**Individual**, location, About
(**No bio available.**), skills. Buttons **Block User** / **Unblock User** (confirm **Are you sure
you want to block this user?** → `POST`/`DELETE /users/:id/block` → **User blocked** / **User
unblocked**), **Report User** (dialog **Please tell us why you are reporting this user.**,
**Reason for reporting...** → `POST /users/:id/report { reason }` → **User reported
successfully. We will review your report.**), link **View profile** (`/companies/[id]` for
companies, `/dashboard/talent/[id]` for company viewers).

### Support chat `/dashboard/support/[id]` (upgrade Phase 4 page)
Replace polling with sockets: `problem_report_message` (append if `reportId` matches, admin
messages arrive this way), `problem_report_status_updated` (refetch). Show status badge
**Open** / **Resolved** (`status === 'closed'`) and disable the composer when closed with
**This report is resolved. Start a new report if you need more help.** Attachments: upload via
`POST /upload` field `file` first, send URLs. Header **Problem**, action **New Report** (confirm
**Start New Report?** / **This will let you report a different problem. Your current
conversation will remain saved.** → `/dashboard/report?new=1`).

### Entry points
- Company: talent detail **Send message** / **Send a message**, explore results message icon,
  employee rows → `/dashboard/messages/[id]`.
- Individual: public company page and dashboard explore company cards get **Message** when the
  viewer is a verified individual (link to `/dashboard/messages/[companyId]`); the messages
  icon in the app header for both roles.
