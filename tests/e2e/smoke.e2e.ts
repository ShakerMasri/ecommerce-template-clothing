import { expect, test } from "@playwright/test";
import { contactConfig } from "../../src/config/contact";
import { storeConfig } from "../../src/config/store";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("homepage loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    new RegExp(escapeRegExp(storeConfig.name), "i"),
  );
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("products page loads", async ({ page }) => {
  await page.goto("/products");

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("footer renders configured public contact sections", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");

  await expect(footer).toBeVisible();

  if (contactConfig.footer.showContactSummary) {
    await expect(footer).toContainText(contactConfig.email.address);
  }

  if (contactConfig.socialLinks.length > 0) {
    const socialLinksList = footer.getByRole("list", {
      name: /social|location|تواصل|موقع/i,
    });

    await expect(socialLinksList).toBeVisible();

    for (const socialLink of contactConfig.socialLinks) {
      await expect(
        socialLinksList.getByRole("link", {
          name: new RegExp(socialLink.label, "i"),
        }),
      ).toBeVisible();
    }
  }

  if (contactConfig.footer.onlineStoreCta.enabled) {
    await expect(
      footer.getByRole("link", { name: /whatsapp|واتساب/i }),
    ).toBeVisible();
  }
});

test("whatsapp support shortcut renders when enabled", async ({ page }) => {
  await page.goto("/products");

  const shortcut = page.getByTestId("whatsapp-support-shortcut");

  if (contactConfig.whatsappShortcut.enabled) {
    await expect(shortcut).toBeVisible();
    await expect(shortcut).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/[^?]+\?text=.+/,
    );
  } else {
    await expect(shortcut).toHaveCount(0);
  }
});
