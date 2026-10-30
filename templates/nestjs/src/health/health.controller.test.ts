import {TerminusModule} from "@nestjs/terminus";
import {Test} from "@nestjs/testing";

import {HealthController} from "./health.controller.js";

describe("HealthController", () => {
  it("reports ok when every check passes", async () => {
    const moduleReference = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    }).compile();

    await expect(moduleReference.get(HealthController).check()).resolves.toMatchObject({
      status: "ok",
    });
  });
});
