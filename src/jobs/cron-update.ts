import { Cron } from "croner";
import { prisma } from "../plugin/db"
import Parser from 'rss-parser';

const parser = new Parser();

// Run every 10 min
export const updateJob = Cron(
  '* */10 * * * *',
  {
    timezone: 'Europe/London',
    name: 'refreshFeeds',
    protect: true,
    interval: 60
  },
  async (cron) => {
    console.log("Refreshing feeds")
    try {
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)
      console.log("minimumLastRefresh", oneHourAgo)
      const feeds = await prisma.feed.findMany({
        where: {
          lastFetched: {
            lte: oneHourAgo,
          },
        },
      })
      console.log("Refresh results", feeds)
      if (!feeds.length) {
        console.log("No feeds to refresh")
        console.log('this', cron)
        console.log('this.nextRun', cron.nextRun())
        return
      }
      console.log(
        `Found ${feeds.length} feeds to refresh`,
        feeds.map((f) => f.url),
      )

      for (const feed of feeds) {
        const response = await fetch(feed.url)
        const xml = await response.text()
        const parsedFeed = await parser.parseString(xml)
        console.log(parsedFeed.items[0])
        // updateFeed(parsedFeed);

        await prisma.feed.update({
          where: {
            id: feed.id,
          },
          data: {
            lastFetched: new Date().toISOString(),
          },
        })
        console.log('this', cron)
        console.log('this.nextRun', cron.nextRun())
      }
    } catch (error) {
      console.error(error)
    }
  });
