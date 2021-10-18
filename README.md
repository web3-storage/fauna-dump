# fauna-dump

Fetch all the docs from all the collections from the FaunaDB

## Getting started

- Install the deps with `npm i`
- Create an `.env` file with your fauna key in `FAUNA_KEY=xxx`
- Run it with `node index.js`

**.env**
```ini
FAUNA_KEY=<your key here>
# FAUNA_POINT_IN_TIME="2021-10-18T15:10:10.575Z"
# FAUNA_PAGE_SIZE=1000
```

The script will log progress to the console and write the data as new-line delimited JSON to the `/dump` dir, with one file per Collection.

**example run**
```console
$ node index.js
🗂 Found 15 collections
✔ Upload 565 [565]
✔ Deal 2254 [1000,1000,254]
✔ Content 547 [547]
✔ PinLocation 6 [6]
✔ Pin 2558 [1000,1000,558]
✔ AuthToken 68 [68]
✔ User 44 [44]
✔ content_deals 0 [0]
✔ Metrics 0 [0]
✔ AggregateEntry 1212 [1000,212]
✔ Aggregate 382 [382]
✔ PinRequest 88 [88]
✔ Metric 9 [9]
✔ PinSyncRequest 0 [0]
✔ Backup 59 [59]
⏱: 6.014s
```

### Alternate adventure

We explore using `fdm` _(deprecated)_ to extract the data too.

see: https://docs.fauna.com/fauna/v4/integrations/fdm/install

```console
# build the image
$ docker build -t fdm .

# run the imaage and mount a local folder to export things to.
$ docker run -it --rm -v $(pwd)/dump:/dump fdm /bin/bash

# run fdm!
> ./fdm -source key=*** -dest path=/dump
2021-10-18.13.20.26
===================

FDM   1.14
2020-04-10 16:30
Loaded property file path: /usr/local/bin/fdm-1.14/fdm.props

Field Formatting
================
<<None>>

Config File
===========
   load:                      data.json
   host:                      cloud
   policy.data:               COPY

Connecting to: CLOUD
Connection was successful.
ERROR insufficient privilages to read all roles.
Output to directory [/dump].
Starting Load at 2021-10-18 13:20:29.
Reading data at 2021-10-18 13:20:29  Fauna Timestamp: 1634563229194000
Collection Aggregate -> Aggregate documents 382 size 0 KB  execution time:    0.226 sec  0.000 MB/sec  1690.3 docs/sec
Collection AggregateEntry -> AggregateEntry documents 1212 size 0 KB  execution time:    0.650 sec  0.000 MB/sec  1864.6 docs/sec
Collection AuthToken -> AuthToken documents 68 size 0 KB  execution time:    0.101 sec  0.000 MB/sec  673.3 docs/sec
Collection Backup -> Backup documents 59 size 0 KB  execution time:    0.066 sec  0.000 MB/sec  893.9 docs/sec
Collection Content -> Content documents 547 size 0 KB  execution time:    0.191 sec  0.000 MB/sec  2863.9 docs/sec
Collection content_deals -> content_deals documents 0 size 0 KB  execution time:    0.050 sec  0.000 MB/sec    0.0 docs/sec
Collection Deal -> Deal documents 2254 size 0 KB  execution time:    1.168 sec  0.000 MB/sec  1929.8 docs/sec
Collection Metric -> Metric documents 9 size 0 KB  execution time:    0.292 sec  0.000 MB/sec   30.8 docs/sec
Collection Metrics -> Metrics documents 0 size 0 KB  execution time:    0.047 sec  0.000 MB/sec    0.0 docs/sec
Collection Pin -> Pin documents 2558 size 0 KB  execution time:    1.177 sec  0.000 MB/sec  2173.3 docs/sec
Collection PinLocation -> PinLocation documents 6 size 0 KB  execution time:    0.127 sec  0.000 MB/sec   47.2 docs/sec
Collection PinRequest -> PinRequest documents 88 size 0 KB  execution time:    0.110 sec  0.000 MB/sec  800.0 docs/sec
Collection PinSyncRequest -> PinSyncRequest documents 0 size 0 KB  execution time:    0.040 sec  0.000 MB/sec    0.0 docs/sec
Collection Upload -> Upload documents 565 size 0 KB  execution time:    0.176 sec  0.000 MB/sec  3210.2 docs/sec
Collection User -> User documents 44 size 0 KB  execution time:    0.068 sec  0.000 MB/sec  647.1 docs/sec
FDM finished at 2021-10-18 13:20:33.
```


## Which documents do we update

The set of Collections and fields that we update

| Collections      | Source
|-----------------|-----------------------
| Content.dagSize | [addAggregateEntries.js](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/addAggregateEntries.js/#L71)
| Deal            | [createOrUpdateDeal.js](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/createOrUpdateDeal.js)
| Metric          | [createOrUpdateMetric.js](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/createOrUpdateMetric.js/#L43)
| Pin.status      | [createOrUpdatePin.js#L79](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/createOrUpdatePin.js#L79)
| User.*          | [createOrUpdateUser.js/#L37](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/createOrUpdateUser.js/#L37)
| User.usedStorage | [createUpload.js/#L110](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/createUpload.js/#L110)
| Pin             | [createUpload.js/#L123](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/createUpload.js/#L123)
| User.usedStorage, Upload.deleted | [deleteUserUpload.js/#L58](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/deleteUserUpload.js/#L58)
| PinRequest.attempts | [incrementPinRequestAttempts.js/#L29](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/incrementPinRequestAttempts.js/#L29)
| User.usedStorage | [incrementUserUsedStorage.js/#L29](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/incrementUserUsedStorage.js/#L29)
| Upload.name | [renameUserUpload.js/#L48](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/renameUserUpload.js/#L48)
| Content.dagSize | [updateContentDagSize.js/#L28](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/updateContentDagSize.js/#L28)
| Pin.status | [updatePins.js/#L27](https://github.com/web3-storage/web3.storage/blob/main/packages/db/fauna/resources/Function/updatePins.js/#L27)

