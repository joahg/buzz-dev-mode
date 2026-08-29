import { openUrl } from "@tauri-apps/plugin-opener";
import type { ReactNode } from "react";

import { useUpdaterContext } from "@/features/settings/hooks/UpdaterProvider";
import { cn } from "@/shared/lib/cn";

// Dev mode replaces the standard sidebar and inbox chrome, which are the only
// surfaces that show auto-update state — without this notice an update can
// download in the background and sit invisible forever.
export function DevUpdateNotice({ macChrome }: { macChrome: boolean }) {
  const { status, installAndRelaunch } = useUpdaterContext();

  const alignment = cn("shrink-0", macChrome && "translate-y-[3px]");

  let content: ReactNode = null;
  if (
    status.state === "available" ||
    status.state === "downloading" ||
    status.state === "installing"
  ) {
    content = (
      <span
        className={cn(alignment, "text-muted-foreground/70")}
        data-testid="dev-mode-update-notice"
      >
        {status.state === "installing"
          ? "update: installing…"
          : "update: downloading…"}
      </span>
    );
  } else if (status.state === "ready") {
    content = (
      <button
        className={cn(
          alignment,
          "cursor-pointer font-semibold text-primary hover:underline",
        )}
        data-testid="dev-mode-update-restart"
        onClick={() => {
          void installAndRelaunch();
        }}
        title="A new version has been downloaded — restart to apply"
        type="button"
      >
        update ready — restart
      </button>
    );
  } else if (status.state === "manual-required") {
    content = (
      <button
        className={cn(
          alignment,
          "cursor-pointer font-semibold text-primary hover:underline",
        )}
        data-testid="dev-mode-update-manual"
        onClick={() => {
          void openUrl(status.releaseUrl);
        }}
        title="Auto-update unavailable — download the new version from GitHub"
        type="button"
      >
        {`update v${status.version} — download`}
      </button>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div
      className="flex h-full shrink-0 items-center pr-4"
      data-tauri-drag-region
    >
      {content}
    </div>
  );
}
