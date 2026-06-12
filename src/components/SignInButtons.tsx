import { buttonClass } from "~/components/ui";

const MicrosoftMark = () => (
  <svg width="15" height="15" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

/**
 * Demo-first CTA hierarchy: the zero-friction demo is the primary action,
 * connecting a real tenant is the considered second step. When demo mode is
 * off, the Microsoft sign-in takes the primary slot. Buttons go full-width
 * when they stack on small screens.
 */
export const SignInButtons = ({
  entraConfigured,
  demoEnabled,
  showNote = true,
}: {
  entraConfigured: boolean;
  demoEnabled: boolean;
  showNote?: boolean;
}) => (
  <div>
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {demoEnabled && (
        <form action="/api/auth/demo" method="post">
          <button className={buttonClass("primary", "w-full sm:w-auto")}>
            See it on a live demo tenant
          </button>
        </form>
      )}
      {entraConfigured ? (
        <a
          href="/api/auth/signin"
          className={buttonClass(
            demoEnabled ? "secondary" : "primary",
            "w-full sm:w-auto",
          )}
        >
          <MicrosoftMark />
          Run a free scan on your tenant
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="Configure AUTH_MICROSOFT_ENTRA_ID_ID to enable Microsoft sign-in"
          className={buttonClass(
            demoEnabled ? "secondary" : "primary",
            "w-full cursor-not-allowed opacity-40 sm:w-auto",
          )}
        >
          <MicrosoftMark />
          Run a free scan on your tenant
          <span className="sr-only">
            (Configure AUTH_MICROSOFT_ENTRA_ID_ID to enable Microsoft sign-in)
          </span>
        </button>
      )}
    </div>
    {showNote && (
      <p className="mt-3 text-xs text-ink-faint">
        The demo needs no account. Scanning your own tenant signs you in with
        Microsoft first — the read-only consent is a separate, clearly
        explained step.
      </p>
    )}
  </div>
);
