import request from "supertest";
import {Test, TestingModule} from "@nestjs/testing";
import type {INestApplication} from "@nestjs/common";
import type {Server} from "node:http";

import {AppModule} from "../src/app.module.js";

describe("AppController (e2e)", () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("GET / returns the greeting", async () => {
    const response = await request(app.getHttpServer()).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World!");
  });

  it("GET /health reports ok", async () => {
    const response = await request(app.getHttpServer()).get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      status: "ok",
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
