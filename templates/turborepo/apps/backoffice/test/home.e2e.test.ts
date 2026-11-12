import {expect, test} from "@playwright/test";

test("serves the home page", async ({page}) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
});

test("admin panel asks for a user to sign in or create the first user", async ({page}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/(login|create-first-user)/);
});
