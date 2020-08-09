import * as dotenv from "dotenv";
import { use, settings } from "nexus";
import { prisma } from "nexus-plugin-prisma";
import { PrismaClient } from "nexus-plugin-prisma/client";
import setupCronJob from "../lib/cronjob";

dotenv.config({ path: "prisma/.env" });

const client = new PrismaClient();

// Reference: https://nexusjs.org/api/nexus/setting
settings.change({
  server: {
    // default "/graphql"
    path: "/",
    // default: true n dev, false in prod
    playground: {
      enabled: true,
    },
    graphql: {
      introspection: true,
    },
  },
});

use(
  prisma({
    client: { instance: client },
    features: { crud: true },
  })
);

setupCronJob(client);
