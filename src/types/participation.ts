import type { ParticipationStatus, Role } from '@/types/api';

/** `GET /participation/status` — the signed-in user's own state. */
export type ParticipationCounterparty = {
  companyId?: string;
  userId?: string;
  companyName?: string;
  name?: string;
  avatar?: string;
  rated: boolean;
};

export type ParticipationOwnStatus = {
  participationScore: number | null;
  participationStatus: ParticipationStatus;
  role: Role;
  period?: string;
  owed?: number;
  rated?: number;
  outstanding?: number;
  complete?: boolean | null;
  counterparties?: ParticipationCounterparty[];
  employers?: ParticipationCounterparty[];
  employees?: ParticipationCounterparty[];
};

/** `GET /participation/:userId` — another subject's score and history. */
export type ParticipationRecord = {
  _id?: string;
  period: string;
  employeesOwed?: number;
  employeesRated?: number;
  complete?: boolean | null;
  scoreBefore?: number;
  scoreAfter?: number;
  change?: number;
  statusAfter?: ParticipationStatus | null;
  graceApplied?: boolean;
};

export type ParticipationOf = {
  userId: string;
  companyId?: string;
  name?: string;
  role: Role;
  participationScore: number | null;
  participationStatus: ParticipationStatus;
  history?: ParticipationRecord[];
};
