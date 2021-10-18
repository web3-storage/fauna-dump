import fs from 'fs'
import ndjson from 'ndjson'
import csvStringify from 'csv-stringify'
import { pipeline } from 'stream/promises'

const toCsv = csvStringify({
  header: true,
  eof: true,
  // columns: ['id', 'dagSize', 'created', 'cid'],
  cast: {
    // map fauna timestamp to a string: e.g 2021-09-27T10:11:04.355480Z
    object: value => value['@ts'] ? value['@ts'] : JSON.stringify(value)
  }
})

async function main (input) {
  if (!fs.existsSync(input)) {
    throw new Error(`Could not open ${input}`)
  }
  await pipeline(
    fs.createReadStream(input),
    ndjson.parse(),
    async function * (source, signal) {
      for await (const { ref, data } of source) {
        const id = ref['@ref'].id
        yield { id, ...data }
      }
    },
    toCsv,
    process.stdout
  )
}

try {
  const input = process.argv[2]
  main(input)
} catch (err) {
  console.log(err)
  process.exit(1)
}
