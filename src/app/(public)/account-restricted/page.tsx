"use client";

import { ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  readRestriction,
  type AppealStatus,
  type StoredRestriction,
} from "@/lib/account-restriction";

const SUPPORT_EMAIL = "support@rateo.ng";
const DEFAULT_POLICY_URL = "/terms#account-enforcement";

const RESTRICTIONS = [
  "Log in or use your account",
  "Apply for or post jobs",
  "Message anyone",
  "Rate or review",
  "Appear in search",
];

type Appeal = { status?: AppealStatus; decisionNote?: string } | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Plain fetch (not the axios client): the appeal token is not a session token,
 * and the client's interceptor would try to log out / redirect.
 */
async function appealFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });
}

function formatUntil(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AccountRestrictedPage() {
  const [ready, setReady] = useState(false);
  const [restriction, setRestriction] = useState<StoredRestriction | null>(null);
  const [appeal, setAppeal] = useState<Appeal>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readRestriction();
    void (async () => {
      // sessionStorage is client-only, so it is read after mount (deferred a
      // tick so the state updates aren't synchronous in the effect body).
      await Promise.resolve();
      setRestriction(stored);
      setReady(true);
      if (!stored?.appealToken || stored.enforcement.appealAllowed === false) return;
      const token = stored.appealToken;
      try {
        const res = await appealFetch("/appeals/me", token);
        if (res.status === 401) {
          setTokenExpired(true);
          return;
        }
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (isRecord(data) && "appeal" in data) setAppeal((data.appeal as Appeal) ?? null);
        else setAppeal(isRecord(data) ? (data as Appeal) : null);
      } catch {
        // Offline: fall back to the stored status.
      }
    })();
  }, []);

  if (!ready) return <PageContainer>{null}</PageContainer>;

  if (!restriction) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-6 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-3 text-xl font-bold text-brand-900">Your account is restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to see the details, or contact {SUPPORT_EMAIL}.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button asChild size="lg" className="h-11 bg-brand-700 text-white">
              <Link href="/login">Log in</Link>
            </Button>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              Contact support
            </a>
          </div>
        </div>
      </PageContainer>
    );
  }

  const { enforcement, appealToken } = restriction;
  const removed = enforcement.status === "removed";
  const banned = enforcement.status === "banned" || removed;
  const policyUrl = enforcement.policyUrl || DEFAULT_POLICY_URL;
  const until = removed
    ? "This account can't be used to sign up again"
    : banned
    ? "This is permanent unless overturned on appeal"
    : enforcement.suspendedUntil
      ? `Suspended until ${formatUntil(enforcement.suspendedUntil)}`
      : "Until further review";
  const appealStatus = appeal?.status ?? enforcement.appealStatus ?? null;
  const hasToken = Boolean(appealToken) && !tokenExpired;

  async function submitAppeal() {
    const text = message.trim();
    if (text.length < 20) {
      setError("Please write at least 20 characters so we understand your side.");
      return;
    }
    if (text.length > 2000) {
      setError("Please keep your appeal under 2000 characters.");
      return;
    }
    if (!appealToken) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await appealFetch("/appeals", appealToken, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      const serverMessage =
        isRecord(data) && typeof data.message === "string" ? data.message : undefined;
      if (res.ok) {
        const created = isRecord(data) && isRecord(data.appeal) ? data.appeal : data;
        setAppeal({ ...(isRecord(created) ? (created as Appeal) : {}), status: "open" });
      } else if (res.status === 401) {
        setTokenExpired(true);
      } else if (res.status === 409) {
        setAppeal({ status: "open" });
      } else if (res.status === 429) {
        setError(serverMessage ?? "Too many attempts. Please try again later.");
      } else if (isRecord(data) && data.code === "APPEAL_NOT_ALLOWED") {
        setError(serverMessage ?? "An appeal is not available for this action.");
      } else {
        setError(serverMessage ?? "Could not submit your appeal. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderAppeal() {
    if (appealStatus === "open") {
      return (
        <p className="text-sm font-medium text-brand-900">
          Appeal under review &mdash; we&rsquo;ll email you.
        </p>
      );
    }
    if (appealStatus === "upheld" || appealStatus === "overturned") {
      return (
        <div className="text-sm text-brand-900">
          <p className="font-medium">
            {appealStatus === "upheld"
              ? "Your appeal was reviewed and the decision was upheld."
              : "Your appeal was successful and the action was overturned. You can log in again."}
          </p>
          {appeal?.decisionNote ? (
            <p className="mt-2 text-muted-foreground">{appeal.decisionNote}</p>
          ) : null}
        </div>
      );
    }
    if (enforcement.appealAllowed === false) {
      return (
        <p className="text-sm text-muted-foreground">
          An appeal isn&rsquo;t available for this action. If you think this is a mistake, contact
          support.
        </p>
      );
    }
    if (!hasToken) {
      return (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-brand-700 underline-offset-4 hover:underline">
            Log in again
          </Link>{" "}
          to submit an appeal.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          If you think this was a mistake, tell us what happened. You can submit one appeal per
          action.
        </p>
        <label htmlFor="appeal-message" className="sr-only">
          Your appeal
        </label>
        <textarea
          id="appeal-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          disabled={submitting}
          placeholder="Explain why this action should be reviewed (at least 20 characters)"
          className="w-full rounded-lg border border-border bg-white p-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <p className="text-right text-xs text-muted-foreground">{message.trim().length}/2000</p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          className="h-11 bg-brand-700 text-white"
          disabled={submitting}
          onClick={() => void submitAppeal()}
        >
          {submitting ? "Submitting…" : "Submit appeal"}
        </Button>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          >
            <ShieldAlert className="size-7" />
          </span>
          <h1 className="text-2xl font-bold text-brand-900">
            {removed ? "Account removed" : banned ? "Account banned" : "Account suspended"}
          </h1>
          {enforcement.reasonLabel ? (
            <p className="mt-2 text-base font-semibold text-foreground">{enforcement.reasonLabel}</p>
          ) : null}
          {removed ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your account was removed for breaking our Terms. You can&rsquo;t sign up again with the same
              email address, phone number or ID. If you believe this is a mistake, you can appeal below.
            </p>
          ) : null}
          {enforcement.userMessage ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{enforcement.userMessage}</p>
          ) : null}
          <p className="mt-3 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-brand-900">
            {until}
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-base font-bold text-brand-900">While restricted you can&rsquo;t:</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {RESTRICTIONS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <XCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href={policyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-brand-700 underline underline-offset-4"
          >
            Read the policy
          </a>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-3 text-base font-bold text-brand-900">Appeal</h2>
          {renderAppeal()}
        </section>

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="lg" className="h-11">
            <a href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
          </Button>
          <Button asChild size="lg" className="h-11 bg-brand-700 text-white">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
