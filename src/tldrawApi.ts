/**
 * THE pinned headless tldraw API surface (Task 2 — grok1 pin #1).
 *
 * ALL raw tldraw imports live here and nowhere else. If an import path is wrong for
 * the installed version, THIS file is the ONLY place to fix it.
 *
 * Constraints enforced by the importGuard test:
 *   - Never import from 'tldraw' (React umbrella) or instantiate Editor.
 *   - Must run in plain Node with no document/window.
 *
 * Import map for tldraw 5.1.1:
 *   createTLSchema, createShapeId, createBindingId  →  @tldraw/tlschema
 *   Store                                           →  @tldraw/store
 *   (createTLStore from @tldraw/editor hangs the process via theme registration;
 *    we construct Store directly from @tldraw/store instead.)
 */

import { createTLSchema, createShapeId as _createShapeId, createBindingId as _createBindingId } from '@tldraw/tlschema'
import { Store } from '@tldraw/store'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ── Types (re-exported for downstream use) ───────────────────────────────────
export type { TLStore, TLRecord, SerializedSchema } from '@tldraw/store'
export type { TLSchema } from '@tldraw/tlschema'

// ── Internal store factory ────────────────────────────────────────────────────

function _makeStoreOptions() {
  return {
    defaultName: '',
    assets: {
      upload: async () => {},
      resolve: async () => '' as string,
      remove: async () => {},
    },
    users: {
      currentUser: { id: 'user:default', name: 'default' },
      resolve: async () => ({} as any),
    },
  } as const
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns the default tldraw schema (all built-in shapes/bindings/assets). */
export function makeSchema() {
  return createTLSchema()
}

/** Returns a fresh, empty document store backed by the default schema. */
export function makeStore() {
  const schema = makeSchema()
  return new Store({ schema, props: _makeStoreOptions() as any })
}

/** Validating insert — throws if the record violates the schema. */
export function putRecord(store: any, record: any): void {
  store.put([record])
}

/** Returns every record currently in the store (flat array). */
export function allRecords(store: any): any[] {
  return store.allRecords()
}

/**
 * Serializes the store's schema to the wire format used in .tldr files.
 * Expected: { schemaVersion: 2, sequences: { ... } }
 */
export function serializeSchema(store: any): any {
  return store.schema.serialize()
}

/** Creates a valid shape record id (e.g. "shape:xxxxxxxx"). */
export function createShapeId(): string {
  return _createShapeId()
}

/** Creates a valid binding record id (e.g. "binding:xxxxxxxx"). */
export function createBindingId(): string {
  return _createBindingId()
}

// ── Default props (extracted by scripts/probe-defaults.mjs) ──────────────────
// NEVER hand-maintained. A version bump just re-runs the probe to refresh this file.
// Any extraction gap fails loudly at store.put validation time.

const _defaultsPath = join(dirname(fileURLToPath(import.meta.url)), 'defaults.json')
const DEFAULTS: Record<string, Record<string, unknown>> = JSON.parse(
  readFileSync(_defaultsPath, 'utf8'),
)

/**
 * Returns a deep clone of the extracted default props for the given shape type.
 * Callers must always override w/h (and start/end for arrows) with real values.
 */
export function getDefaultPropsFor(
  type: 'geo' | 'note' | 'text' | 'arrow',
): Record<string, unknown> {
  const d = DEFAULTS[type]
  if (!d) throw new Error(`no extracted defaults for '${type}' — run: npm run probe-defaults`)
  return structuredClone(d)
}
