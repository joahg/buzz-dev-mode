import { expect, test } from "@playwright/test";

import { waitForAnimations } from "../helpers/animations";
import { installMockBridge } from "../helpers/bridge";

const SHOTS = "test-results/import-sections";

test("imports a pasted outline into sidebar sections", async ({ page }) => {
  await installMockBridge(page);
  await page.goto("/");
  await expect(page.getByTestId("channel-general")).toBeVisible();

  await page.getByText("Channels", { exact: true }).hover();
  await page.getByTestId("section-actions-channels").click();
  await page.getByRole("menuitem", { name: "Import sections…" }).click();

  await page
    .getByTestId("import-sections-input")
    .fill(
      [
        "Team",
        "#engineering",
        "- random",
        "",
        "Elsewhere",
        "#not-a-channel",
      ].join("\n"),
    );

  const preview = page.getByTestId("import-sections-preview");
  await expect(preview).toContainText("Team (new) · 2 matched");
  await expect(preview).toContainText("Elsewhere (new) · 0 matched");
  await expect(preview).toContainText("Not found: not-a-channel");
  await waitForAnimations(page);
  await page.screenshot({ path: `${SHOTS}/01-preview.png` });

  await page.getByTestId("import-sections-confirm").click();
  await expect(page.getByTestId("import-sections-input")).toBeHidden();

  const titles = page.locator("[data-testid^='section-title-']");
  await expect(titles).toHaveText(["Team", "Elsewhere"]);
  const streamList = page.getByTestId("stream-list");
  await expect(streamList.getByTestId("channel-engineering")).toHaveCount(0);
  await expect(streamList.getByTestId("channel-random")).toHaveCount(0);
  await expect(page.getByTestId("channel-engineering")).toBeVisible();
  await expect(page.getByTestId("channel-random")).toBeVisible();
  await waitForAnimations(page);
  await page.screenshot({ path: `${SHOTS}/02-imported.png` });
});
