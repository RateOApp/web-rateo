import { api } from '@/lib/api/client';
import type {
  CreateTicketPayload,
  SendMessagePayload,
  SupportMessage,
  SupportTicket,
  UploadResponse,
} from '@/types/support';

/**
 * Problem reports. Routes: `server-rateo/src/routes/supportRoutes.js`.
 *
 * Creating a ticket CLOSES every other open ticket for the same user
 * (`createTicket` in the controller), so the report form only ever has to deal
 * with one open thread.
 */
export const supportService = {
  /** `GET /support/tickets` — newest `updatedAt` first. */
  list(): Promise<SupportTicket[]> {
    return api
      .get<SupportTicket[] | { tickets?: SupportTicket[] }>('/support/tickets')
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data?.tickets ?? [])));
  },

  create(payload: CreateTicketPayload): Promise<SupportTicket> {
    return api.post<SupportTicket>('/support/tickets', payload).then((r) => r.data);
  },

  byId(id: string): Promise<SupportTicket> {
    return api
      .get<SupportTicket>(`/support/tickets/${encodeURIComponent(id)}`)
      .then((r) => r.data);
  },

  /** Answers 201 with the appended message, not the whole ticket. */
  sendMessage(id: string, payload: SendMessagePayload): Promise<SupportMessage> {
    return api
      .post<SupportMessage>(`/support/tickets/${encodeURIComponent(id)}/messages`, payload)
      .then((r) => r.data);
  },

  /**
   * `POST /upload`, multipart field `file` -> `{ url }` (Cloudinary). Never set
   * `Content-Type` by hand: the browser must add the multipart boundary.
   */
  uploadEvidence(file: File): Promise<UploadResponse> {
    const body = new FormData();
    body.append('file', file);
    return api.post<UploadResponse>('/upload', body).then((r) => r.data);
  },
};
