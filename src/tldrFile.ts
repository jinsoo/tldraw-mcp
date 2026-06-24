/**
 * tldrFile.ts — headless .tldr file reader with auto-migration (Task 3).
 *
 * Reads the on-disk envelope:
 *   { tldrawFileFormatVersion: 1, schema: SerializedSchema, records: TLRecord[] }
 * and returns a populated TLStore, migrating the records to the installed schema
 * version via schema.migrateStoreSnapshot().
 *
 * Migration API used: schema.migrateStoreSnapshot({ store: map, schema: fileSchema })
 *   where `store` is a Record<id, TLRecord> map and `schema` is the file's serialized
 *   schema. Returns { type: 'success', value: map } or { type: 'error', reason }.
 *
 * NEVER imports from 'tldraw' or '@tldraw/editor' — those hang Node (Task 2 finding).
 * All tldraw access goes through tldrawApi.ts only.
 */

import { makeSchema, makeStore, putRecord, allRecords, serializeSchema } from './tldrawApi.js'

export interface ReadTldrResult {
  store: ReturnType<typeof makeStore>
  migrated: boolean
  fileVersion: number
}

/**
 * Parses a .tldr file JSON string into a populated TLStore, auto-migrating
 * older schema versions up to the installed one.
 *
 * @throws if tldrawFileFormatVersion is not a number, is > 1, or migration fails.
 */
export function readTldrFile(json: string): ReadTldrResult {
  const parsed = JSON.parse(json)

  const fileVersion = parsed?.tldrawFileFormatVersion
  if (typeof fileVersion !== 'number' || fileVersion > 1) {
    throw new Error(
      `unsupported tldrawFileFormatVersion: ${JSON.stringify(fileVersion)} (only ≤ 1 supported)`,
    )
  }

  const fileSchema = parsed?.schema ?? {}
  const fileRecords: any[] = Array.isArray(parsed?.records) ? parsed.records : []

  // Convert records array → id-keyed map for migrateStoreSnapshot
  const storeMap: Record<string, any> = {}
  for (const record of fileRecords) {
    storeMap[record.id] = record
  }

  // Obtain the installed schema and migrate
  const installedSchema = makeSchema()
  const migration = installedSchema.migrateStoreSnapshot({ store: storeMap, schema: fileSchema })

  if (migration.type !== 'success') {
    throw new Error(`tldraw migration failed: ${(migration as any).reason ?? 'unknown'}`)
  }

  // Detect whether any sequences actually differed (= a real migration occurred)
  const fileSeqs: Record<string, number> = fileSchema?.sequences ?? {}
  const installedSeqs: Record<string, number> = installedSchema.serialize().sequences ?? {}
  const migrated = Object.keys({ ...fileSeqs, ...installedSeqs }).some(
    (k) => (fileSeqs[k] ?? 0) !== (installedSeqs[k] ?? 0),
  )

  // Load migrated records into a fresh store
  const store = makeStore()
  for (const record of Object.values(migration.value)) {
    try {
      putRecord(store, record)
    } catch {
      // Skip records the installed schema doesn't recognise (e.g. removed shape types)
    }
  }

  return { store, migrated, fileVersion }
}

/**
 * Serializes a TLStore to a .tldr file JSON string (hand-assembled envelope).
 *
 * Does NOT use serializeTldrawJson — that requires an Editor instance and hangs Node.
 * Instead, hand-assembles the envelope directly from the store's records and schema.
 *
 * Envelope format:
 *   { tldrawFileFormatVersion: 1, schema: SerializedSchema, records: TLRecord[] }
 *
 * Note: records is a flat ARRAY (not a map) — readTldrFile converts array→map on read.
 * If a record was skipped on read (unrecognised type), it will not appear in the output.
 */
export function writeTldrFile(store: ReturnType<typeof makeStore>): string {
  return JSON.stringify({
    tldrawFileFormatVersion: 1,
    schema: serializeSchema(store),
    records: allRecords(store), // flat ARRAY of document-scoped records
  })
}
