import {describe, expect, it} from "vitest";

import {Users} from "./users";

describe("Users", () => {
  it("enables authentication and titles users by email", () => {
    expect(Users.auth).toBe(true);
    expect(Users.admin?.useAsTitle).toBe("email");
  });
});
