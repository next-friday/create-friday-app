import {buildConfig} from "payload";
import {fileURLToPath} from "node:url";
import {lexicalEditor} from "@payloadcms/richtext-lexical";
import path from "node:path";
import {postgresAdapter} from "@payloadcms/db-postgres";
import sharp from "sharp";

import {Media} from "./collections/media";
import {migrations} from "./migrations";
import {requireEnvironment} from "./environment";
import {Users} from "./collections/users";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const lintBanner = /^\/\* [a-z]+lint[:-]disable \*\/\n/gmu;
const serverURL = requireEnvironment("APP_URL");
const maxUploadBytes = 10_000_000;

export default buildConfig({
  serverURL,
  sharp,
  cors: [serverURL],
  collections: [Users, Media],
  graphQL: {
    disable: true,
  },
  upload: {
    limits: {
      fileSize: maxUploadBytes,
    },
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, "app/(payload)/admin/importMap.ts"),
    },
  },
  editor: lexicalEditor(),
  secret: requireEnvironment("PAYLOAD_SECRET"),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
    postProcess: [({compiledTypes}) => compiledTypes.replaceAll(lintBanner, "")],
  },
  db: postgresAdapter({
    prodMigrations: migrations,
    pool: {
      connectionString: requireEnvironment("DATABASE_URL"),
    },
  }),
});
