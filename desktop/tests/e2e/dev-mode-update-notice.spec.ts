import { expect, test } from "@playwright/test";

import { installMockBridge } from "../helpers/bridge";

// Dev mode replaces the standard sidebar and inbox chrome — the only surfaces
// that show auto-update state. These tests pin the dev-mode top-bar notice so
// a downloaded update can never sit invisible again.

async function openDevMode(
  page: import("@playwright/test").Page,
  mock: Parameters<typeof installMockBridge>[1],
) {
  await installMockBridge(page, mock);
  await page.addInitScript(() => {
    localStorage.setItem("buzz.displayStyle", "developer");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByTestId("dev-mode-shell").waitFor();
}

test("background-downloaded update surfaces a restart notice in the top bar", async ({
  page,
}) => {
  await openDevMode(page, { updateAvailable: true, restartDelayMs: 500 });

  const restart = page.getByTestId("dev-mode-update-restart");
  await expect(restart).toBeVisible();
  await expect(restart).toHaveText("update ready — restart");

  await restart.click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const commands =
          (window as Window & { __BUZZ_E2E_COMMANDS__?: string[] })
            .__BUZZ_E2E_COMMANDS__ ?? [];
        return commands.includes("plugin:updater|install");
      }),
    )
    .toBe(true);
});

test("unsupported auto-update surfaces a manual download notice", async ({
  page,
}) => {
  await openDevMode(page, {
    updateAvailable: true,
    updateVersion: "9.9.9",
    autoUpdateSupported: false,
  });

  const manual = page.getByTestId("dev-mode-update-manual");
  await expect(manual).toBeVisible();
  await expect(manual).toHaveText("update v9.9.9 — download");
  await expect(page.getByTestId("dev-mode-update-restart")).toHaveCount(0);
});

test("no update leaves the top bar clean", async ({ page }) => {
  await openDevMode(page, {});

  await expect(page.getByTestId("dev-mode-update-notice")).toHaveCount(0);
  await expect(page.getByTestId("dev-mode-update-restart")).toHaveCount(0);
  await expect(page.getByTestId("dev-mode-update-manual")).toHaveCount(0);
});
