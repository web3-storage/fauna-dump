import { pipeline } from 'stream/promises'
import faunadb from 'faunadb'
import dotenv from 'dotenv'
import retry from 'p-retry'
import path from 'path'
import ora from 'ora'
import fs from 'fs'

dotenv.config()

const POINT_IN_TIME = process.env.FAUNA_POINT_IN_TIME || (new Date()).toISOString()
const PAGE_SIZE = Number.parseInt(process.env.FAUNA_PAGE_SIZE) || 1000
const OUTPUT_DIR = 'dump'
const q = faunadb.query
const client = new faunadb.Client({ secret: process.env.FAUNA_KEY })

const excludedCollections = ['Aggregate', 'AggregateEntry', 'content_deals', 'Metric', 'Metrics', 'Deal']

async function findAllCollections () {
  const res = await client.query(q.Paginate(q.Collections()))
  return res.data.filter(c => !excludedCollections.includes(c.id))
}

async function * fetchAllDocuments (collectionRef) {
  let after
  do {
    const page = await retry(() => client.query(
      q.At(
        q.Time(POINT_IN_TIME),
        q.Map(
          q.Paginate(q.Documents(collectionRef), {
            size: PAGE_SIZE,
            after
          }),
          q.Lambda(['ref'], q.Get(q.Var('ref')))
        )
      )
    ), { forever: true })

    after = page.after
    yield page
  } while (after)
}

async function main () {
  console.time('⏱')
  const spinner = ora('Fetching collections from Fauna').start()
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR)
  }
  const collections = await findAllCollections()
  spinner.stopAndPersist({ symbol: '🗂', text: `Found ${collections.length} collections` })
  spinner.info(`Querying DB snapshot at ${POINT_IN_TIME}`)
  spinner.info(`Downloading in batches of ${PAGE_SIZE}...`)
  for (const collection of collections) {
    let count = 0
    spinner.start(`${collection.id} ${count}`)
    await pipeline(
      fetchAllDocuments(collection),
      async function * logProgress (source) {
        for await (const page of source) {
          yield page
          count += page.data.length
          spinner.text = `${collection.id} ${count} ${page?.after ? `after: ${page?.after}` : ''}`
        }
      },
      async function * stringify (source) {
        for await (const page of source) {
          yield page.data.map(d => JSON.stringify(d)).join('\n') + '\n'
        }
      },
      fs.createWriteStream(path.join(OUTPUT_DIR, `${collection.id}.ndjson`))
    )
    spinner.succeed()
  }
  console.timeEnd('⏱')
}

main()
