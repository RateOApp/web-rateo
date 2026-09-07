/**
 * Support tickets and FAQs.
 *
 * Field names come from `server-rateo/src/models/SupportTicket.js` and
 * `src/controllers/supportController.js` — the ticket is returned raw (a Mongo
 * document), so every field except `_id` is treated as optional here.
 */

/** The model enum is `open | closed`; admin tooling emits other labels. */
export type SupportTicketStatus = 'open' | 'closed' | (string & {});

export type SupportMessageSenderRole = 'user' | 'admin' | (string & {});

/** One entry of `ticket.messages`. `sender` is the raw ObjectId string. */
export type SupportMessage = {
  _id?: string;
  sender?: string;
  senderRole?: SupportMessageSenderRole;
  text?: string;
  attachments?: string[];
  createdAt?: string;
};

export type SupportTicket = {
  _id: string;
  user?: string;
  type?: string;
  description?: string;
  attachments?: string[];
  status?: SupportTicketStatus;
  messages?: SupportMessage[];
  createdAt?: string;
  updatedAt?: string;
};

/** `POST /support/tickets`. The controller seeds `messages[0]` from these. */
export type CreateTicketPayload = {
  type: string;
  description: string;
  attachments?: string[];
};

/** `POST /support/tickets/:id/messages` — answers 201 with the message only. */
export type SendMessagePayload = {
  text: string;
  attachments?: string[];
};

/** `POST /upload`, multipart field `file`. */
export type UploadResponse = {
  url: string;
  public_id?: string;
  message?: string;
};

/**
 * `GET /faqs` — the public controller projects `id` (string), not `_id`, but
 * older deployments return the raw document, so both are accepted.
 */
export type FaqResponseItem = {
  id?: string;
  _id?: string;
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
};

/** Normalised FAQ used by the UI. */
export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
};

/** The fixed list the mobile report form offers. */
export const PROBLEM_TYPES = [
  'Feature Not Working',
  'Bug Report',
  'Performance Issue',
  'UI/UX Problem',
  'Account Issue',
  'Other',
] as const;

export type ProblemType = (typeof PROBLEM_TYPES)[number];
