import Parser from 'rss-parser';
import type { Task } from "./queue"
import { prisma } from "./db"

const parser = new Parser({
  defaultRSS: 2.0,
  customFields: {
    feed: ['language', 'copyright'],
    item: [
      ['media:content', 'media', { keepArray: true }],
    ],
  }
});

export async function queueWorker(arg: Task): Promise<void> {
  console.log("queue.arg", arg)
  const response = await fetch(arg.feedUrl)
  const xml = await response.text()
  const feed = await parser.parseString(xml)
  console.log('queue.parsedFeed', feed.link)
  console.log(`Inserting ${arg.feedUrl}`)

  await prisma.feed.create({
    data: {
      name: feed.title ? feed.title : feed.link ?? "",
      url: arg.feedUrl,
      description: feed.description,
      language: feed.language,
      copyright: feed.copyright,
      lastFetched: new Date().toISOString(),
      user: {
        connect: {
          id: arg.userId,
        },
      },
      feedEntries: {
        create: feed.items.map((item) => ({
          title: item.title ?? "",
          guid: item.guid,
          link: item.link ?? "",
          author: item.creator,
          content: item.content,
          contentSnippet: item.contentSnippet,
          ingested: new Date().toISOString(),
          published: item.isoDate ? item.isoDate : item.pubDate ? new Date(item.pubDate) : null,
          categories: item.categories?.map((c: string) => c.replaceAll('\n', '').trim()).filter((c: string) => !c.includes('|')).filter(Boolean),
          user: {
            connect: {
              id: arg.userId,
            },
          },
          feedMedia: {
            create: item.media?.map((media: Record<string, Record<string, unknown>>) => ({
              href: media['$'].url,
              title: media['media:tite'],
              description: media['media:description'],
              credit: media['media:credit'],
              medium: media['$'].medium,
              height: media['$'].height,
              width: media['$'].width,
              user: {
                connect: {
                  id: arg.userId,
                },
              },
            })),
          },
        })),
      },
    },
  })
}
