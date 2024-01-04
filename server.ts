import { Hono } from "https://deno.land/x/hono@v3.4.1/mod.ts";
import { logger } from "https://deno.land/x/hono/middleware.ts";
import Logger from "https://deno.land/x/logger@v1.1.3/logger.ts";
import { parseFeed } from "https://deno.land/x/rss/mod.ts";
import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";
import { datetime } from "https://deno.land/x/ptera/mod.ts";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Prisma = require("./generated/client/index.js");

const env = await load();

const app = new Hono();

const denoLogger = new Logger();

const customLogger = (message: string, ...rest: string[]) => {
  denoLogger.info(message, ...rest);
};

app.use("*", logger(customLogger));

const prisma = new Prisma.PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

type Feed = {
  timestamp: number;
  payload: Record<string, unknown>;
};

const kv = await Deno.openKv();

kv.listenQueue(async (message) => {
  console.log("message", message);
  try {
    const response = await fetch(message.feedUrl);
    const xml = await response.text();
    const feed = await parseFeed(xml);

    denoLogger.info(`Inserting ${message.feedUrl}`);

    await prisma.feed.create({
      data: {
        name: feed.title.value,
        url: message.feedUrl,
        lastFetched: new Date().toISOString(),
        user: {
          connect: {
            id: message.userId,
          },
        },
        feedEntries: {
          create: feed.entries.map((item) => ({
            title: item.title.value,
            link: item.links[0].href,
            description: item.description.value,
            ingested: new Date().toISOString(),
            user: {
              connect: {
                id: message.userId,
              },
            },
            author: item.author.name,
            feedMedia: {
              create: item["media:content"]?.map((media) => ({
                href: media.url,
                title: media.title ?? "",
                user: {
                  connect: {
                    id: message.userId,
                  },
                },
                medium: media.medium,
                height: media.height,
                width: media.width,
              })),
            },
          })),
        },
      },
    });
  } catch (error) {
    denoLogger.error(error.message);
  }
});

app.get("/", (c) => c.text("Welcome to RSS Fetcher"));

// Add new feeds
app.post("/feed", async ({ req }) => {
  try {
    const payload = await req.json();
    if (!payload.feedUrl || !payload.userId) {
      throw new Error("feedUrl required");
    }
    await kv.enqueue(payload);
    denoLogger.info(`Enqueued feed - ${payload.feedUrl}`);
    return new Response("", { status: 200 });
  } catch (error) {
    denoLogger.error(error.message);
    return new Response(
      JSON.stringify({ status: "failed", error: error.message }),
      { status: 500 },
    );
  }
});

app.get("/feed", async ({ req }) => {
  const iter = kv.list<string>({ prefix: ["rss"] });
  const feeds: Feed[] = [];
  for await (const res of iter) {
    feeds.push({
      timestamp: res.key[1],
      payload: res.value,
    });
  }
  return new Response(JSON.stringify(feeds, null, 2));
});

// Fetch updates to feeds every 10 min
// updating only those that haven't been updated since 1hr
Deno.cron("refreshFeeds", "0/10 * * * *", async () => {
  denoLogger.info("Refreshing feeds");
  try {
    const feeds = await prisma.feed.findMany({
      where: {
        modified: {
          gt: datetime().subtract({ hours: 1 }).toISO()
        }
      },
    });
    denoLogger.info('Refresh results', feeds)
    if (!feeds.length) {
      denoLogger.info('No feeds to refresh')
      return
    }
    denoLogger.info(`Found ${feeds.length} feeds to refresh`, feeds.map(f => f.url))

    for (const feed of feeds) {
      const response = await fetch(feed.payload.feedUrl);
      const xml = await response.text();
      const parsedFeed = await parseFeed(xml);
      // updateFeed(parsedFeed);

      await prisma.feed.update({
        where: {
          id: feed.id,
        },
        data: {
          lastFetched: new Date().toISOString(),
        }
      })
    }
  } catch (error) {
    denoLogger.error(error.message);
  }
});

Deno.serve(app.fetch);
