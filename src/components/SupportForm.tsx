"use client";

import Script from "next/script";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SUPPORT_EMAIL } from "~/lib/support";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

export function SupportForm({
  siteKey,
  nonce,
  supportEmail = SUPPORT_EMAIL,
}: {
  siteKey?: string;
  nonce?: string;
  supportEmail?: string;
}) {
  const t = useTranslations("support.form");
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const submitting = useRef(false);
  const requestId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const api = () => (window as Window & { turnstile?: Turnstile }).turnstile;

  useEffect(() => {
    const turnstile = api();
    if (!siteKey || !ready || !container.current || !turnstile || sent) return;
    widget.current = turnstile.render(container.current, {
      sitekey: siteKey,
      action: "support",
      theme: "light",
      callback: (value: string) => {
        setToken(value);
      },
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setError(t("verificationLoadError", { email: supportEmail }));
      },
    });
    return () => {
      if (widget.current !== null) turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [ready, siteKey, sent, supportEmail]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || (siteKey && !token)) return;
    submitting.current = true;
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
          website: data.get("website"),
          token,
          requestId: requestId.current,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || result.success !== true)
        throw new Error(result.error ?? t("defaultError"));
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === "Error"
          ? cause.message
          : t("genericError", { email: supportEmail }),
      );
      setToken("");
      if (widget.current !== null) api()?.reset(widget.current);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (sent)
    return (
      <div
        role="status"
        className="rounded-2xl border border-teal-200 bg-teal-50 p-8"
      >
        <h2 className="text-ink text-xl font-semibold">{t("sentTitle")}</h2>
        <p className="mt-3 text-slate-700">{t("sentBody")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-teal-800 underline"
        >
          {t("backHome")}
        </Link>
      </div>
    );

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
  return (
    <>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          nonce={nonce}
          onReady={() => setReady(true)}
          onError={() =>
            setError(
              t("verificationLoadErrorFatal", { email: supportEmail }),
            )
          }
        />
      )}
      <form onSubmit={submit} className="space-y-6" aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="support-name"
            >
              {t("name")}
              <input
                id="support-name"
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                className={inputClass}
              />
            </label>
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="support-email"
            >
              {t("email")}
              <input
                id="support-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                className={inputClass}
              />
            </label>
          </div>
          <label
            className="block text-sm font-semibold text-slate-800"
            htmlFor="support-subject"
          >
            {t("subject")}
            <input
              id="support-subject"
              name="subject"
              required
              maxLength={160}
              className={inputClass}
            />
          </label>
          <label
            className="block text-sm font-semibold text-slate-800"
            htmlFor="support-message"
          >
            {t("message")}
            <textarea
              id="support-message"
              name="message"
              required
              maxLength={10000}
              rows={7}
              aria-describedby="support-message-hint"
              className={inputClass}
            />
          </label>
          <p
            id="support-message-hint"
            className="text-sm leading-6 text-slate-600"
          >
            {t("messageHint")}
          </p>
          <div hidden aria-hidden="true">
            <label htmlFor="support-website">{t("website")}</label>
            <input
              id="support-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </fieldset>
        <div ref={container} />
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <p className="text-sm leading-6 text-slate-600">
          {t.rich("privacyNote", {
            privacyLink: (chunks) => (
              <Link href="/privacy" className="text-teal-800 underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <button
          type="submit"
          disabled={pending || Boolean(siteKey && !token)}
          className="min-h-12 rounded-lg bg-teal-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </>
  );
}
