/// <reference lib="deno.ns" />

import { Hono } from "hono/mod.ts"
import { logger } from "hono/middleware.ts"
import Logger from "logger"
import { parseFeed } from "rss"
import { load } from "$std/dotenv/mod.ts"
import { datetime } from "ptera"

import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const Prisma = require("../generated/client/index.js")

// import { datetime, Hono, load, Logger, logger, parseFeed, Prisma } from "../deps.ts"

const env = await load()

const app = new Hono()

const denoLogger = new Logger()

const customLogger = (message: string, ...rest: string[]) => {
  denoLogger.info(message, ...rest)
}

// @ts-ignore fix
app.use("*", logger(customLogger))

const prisma = new Prisma.PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
})

type Payload = {
  feedUrl: string
  userId: string
}

type Feed = {
  timestamp: number
  payload: Payload
}

const kv = await Deno.openKv()

kv.listenQueue(async (message: Payload): Promise<void> => {
  denoLogger.info("message", message)
  try {
    const response = await fetch(message.feedUrl)
    const xml = await response.text()
    const feed = await parseFeed(xml)

    denoLogger.info(`Inserting ${message.feedUrl}`)

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
    })
  } catch (error) {
    denoLogger.error(error.message)
  }
})

app.get("/", (c) => c.text("Welcome to RSS Fetcher"))

// Add new feeds
app.post("/feed", async ({ req }) => {
  try {
    const payload = await req.json()
    if (!payload.feedUrl || !payload.userId) {
      throw new Error("feedUrl required")
    }
    await kv.enqueue(payload)
    denoLogger.info(`Enqueued feed - ${payload.feedUrl}`)
    return new Response("", { status: 200 })
  } catch (error) {
    denoLogger.error(error.message)
    return new Response(
      JSON.stringify({ status: "failed", error: error.message }),
      { status: 500 },
    )
  }
})

app.get("/feed", async ({ req }) => {
  const iter = kv.list<string>({ prefix: ["rss"] })
  const feeds: Feed[] = []
  for await (const res of iter) {
    feeds.push({
      timestamp: res.key[1],
      payload: res.value,
    })
  }
  return new Response(JSON.stringify(feeds, null, 2))
})

// Fetch updates to feeds every 10 min
// updating only those that haven't been updated since 1hr
Deno.cron("refreshFeeds", "*/10 * * * *", async () => {
  denoLogger.info("Refreshing feeds")
  try {
    const feeds = await prisma.feed.findMany({
      where: {
        modified: {
          gt: datetime().subtract({ hours: 1 }).toISO(),
        },
      },
    })
    denoLogger.info("Refresh results", feeds)
    if (!feeds.length) {
      denoLogger.info("No feeds to refresh")
      return
    }
    denoLogger.info(
      `Found ${feeds.length} feeds to refresh`,
      feeds.map((f) => f.url),
    )

    for (const feed of feeds) {
      const response = await fetch(feed.payload.feedUrl)
      const xml = await response.text()
      const parsedFeed = await parseFeed(xml)
      // updateFeed(parsedFeed);

      await prisma.feed.update({
        where: {
          id: feed.id,
        },
        data: {
          lastFetched: new Date().toISOString(),
        },
      })
    }
  } catch (error) {
    denoLogger.error(error.message)
  }
})

Deno.serve(app.fetch)