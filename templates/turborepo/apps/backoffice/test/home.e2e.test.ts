import {expect, test} from "@playwright/test";

test("home page shows the template heading", async ({page}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
    }),
  ).toHaveText("Next Friday Payload template");
});

test("admin panel asks for a user to sign in or create the first user", async ({page}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/(login|create-first-user)/);
});
