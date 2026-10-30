import {ConsoleLogger} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import type {NestExpressApplication} from "@nestjs/platform-express";

import {AppModule} from "./app.module.js";
import {parsePort} from "./port.js";

/**
 * Start the HTTP server on the port given by the `PORT` environment variable. Production logs are JSON lines.
 */
async function bootstrap() {
  const port = parsePort(process.env.PORT);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({
      json: process.env.NODE_ENV === "production",
    }),
  });

  app.disable("x-powered-by");
  app.enableShutdownHooks();
  await app.listen(port);
}

void bootstrap();
