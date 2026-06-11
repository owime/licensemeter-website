import { buttonClass } from "~/components/ui";

const MicrosoftMark = () => (
  <svg width="15" height="15" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

export const SignInButtons = ({
  entraConfigured,
  demoEnabled,
}: {
  entraConfigured: boolean;
  demoEnabled: boolean;
}) => (
  <div>
    <div className="flex flex-wrap items-center gap-3">
      {entraConfigured ? (
        <a href="/api/auth/signin" className={buttonClass("primary")}>
          <MicrosoftMark />
          Run a free waste scan
        </a>
      ) : (
        <span
          aria-disabled="true"
          title="Configure AUTH_MICROSOFT_ENTRA_ID_ID to enable Microsoft sign-in"
          className={buttonClass("primary", "cursor-not-allowed opacity-40")}
        >
          <MicrosoftMark />
          Run a free waste scan
        </span>
      )}
      {demoEnabled && (
        <form action="/api/auth/demo" method="post">
          <button className={buttonClass("secondary")}>
            Explore the demo workspace
          </button>
        </form>
      )}
    </div>
    <p className="mt-3 text-xs text-ink-faint">
      Signs you in with Microsoft. The read-only consent for your tenant is a
      separate, clearly explained step.
    </p>
  </div>
);
