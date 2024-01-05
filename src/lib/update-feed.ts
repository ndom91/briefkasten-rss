import { prisma } from "@plugin/db"
import type { Feed } from "@types"

const updateFeed = async (feed: Feed, parsedFeed: any) => {
  // const { items, ...parsedFeedMetadata } = parsedFeed
  const { items } = parsedFeed

  // Get GUIDs of all items parsed from feed
  const itemGuids = items.map((item: Record<string, unknown>) => item.guid)

  // Find pre-existing feed entries
  const matchedFeedEntries = await prisma.feedEntry.findMany({
    select: {
      guid: true,
    },
    where: {
      guid: {
        in: itemGuids
      },
      feedId: feed.id,
      userId: feed.userId
    }
  })

  // Diff pre-existing feed entries and new feed parsed items
  const newItems = items.filter(item => !matchedFeedEntries.some(entry => entry.guid === item.guid))
  console.log("[CRON]", 'new.items', newItems)
  console.log("[CRON]", 'example.item', items[0])

  // If no new items, return
  if (!newItems.length) {
    return
  }

  // If we have new items to insert, insert their FeedEntry and FeedEntryMedia
  await prisma.feedEntry.create({
    data: newItems.map((item) => ({
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
          id: feed.userId,
        },
      },
      feed: {
        connect: {
          id: feed.id,
        },
      },
      feedMedia: {
        create: item.media?.map((media: Record<string, Record<string, unknown>>) => ({
          href: media['$'].url,
          title: media['media:tite']?.[0],
          description: media['media:description']?.[0],
          credit: media['media:credit']?.[0],
          medium: media['$'].medium,
          // @ts-expect-error
          height: media['$'].height ? parseInt(media['$'].height) : null,
          // @ts-expect-error
          width: media['$'].width ? parseInt(media['$'].width) : null,
          user: {
            connect: {
              id: feed.userId,
            },
          },
        })),
      },
    })),
  })
}

export {
  updateFeed
}
