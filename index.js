import { pipeline } from 'stream/promises'
import faunadb from 'faunadb'
import dotenv from 'dotenv'
import path from 'path'
import ora from 'ora'
import fs from 'fs'

dotenv.config()

const OUTPUT_DIR = 'dump'
const q = faunadb.query
const client = new faunadb.Client({ secret: process.env.FAUNA_KEY })

const excludedCollections = ['Aggregate', 'AggregateEntry']

async function findAllCollections () {
  const res = await client.query(q.Paginate(q.Collections()))
  return res.data.filter(c => !excludedCollections.includes(c.name))
}

async function * fetchAllDocuments (collectionRef) {
  let after
  do {
    const page = await client.query(
      q.Map(
        q.Paginate(q.Documents(collectionRef), {
          size: process.env.FAUNA_PAGE_SIZE || 1000,
          after
        }),
        q.Lambda(['ref'], q.Get(q.Var('ref')))
      )
    )
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
  for (const collection of collections) {
    let count = 0
    const lengths = []
    spinner.start(`${collection.id} ${count}`)
    await pipeline(
      fetchAllDocuments(collection),
      async function * logProgress (source) {
        for await (const page of source) {
          yield page
          lengths.push(page.data.length)
          count += page.data.length
          spinner.text = `${collection.id} ${count} ${JSON.stringify(lengths)}`
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
