import Parser from 'rss-parser';
import type { Task } from "./queue"
import { prisma } from "./db"

const parser = new Parser();

export async function queueWorker(arg: Task): Promise<void> {
  console.log("queue.arg", arg)
  const response = await fetch(arg.feedUrl)
  const xml = await response.text()
  const feed = await parser.parseString(xml)
  console.log('queue.parsedFeed', feed)
  return

  console.log(`Inserting ${arg.feedUrl}`)

  await prisma.feed.create({
    data: {
      name: feed.title.value,
      url: arg.feedUrl,
      lastFetched: new Date().toISOString(),
      user: {
        connect: {
          id: arg.userId,
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
              id: arg.userId,
            },
          },
          author: item.author.name,
          feedMedia: {
            create: item["media:content"]?.map((media) => ({
              href: media.url,
              title: media.title ?? "",
              user: {
                connect: {
                  id: arg.userId,
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
}
