// BUILD-TIME ONLY (never the engine runtime).
// Extracts real default props for geo/note/text/arrow from @tldraw/tlschema (CJS, no DOM).
// Strategy: use the shape-props validators (which embed style defaultValues) plus
// known numeric/complex defaults verified against store.put validation.
// Re-run on every @tldraw bump: npm run probe-defaults
//
// NOTE: We do NOT install the `tldraw` React umbrella — the validators in
// @tldraw/tlschema are sufficient and node-clean.

import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const req = createRequire(join(__dirname, '../package.json'))

const WANTED = ['geo', 'note', 'text', 'arrow']

// Helper: extract defaultValue from a tldraw style/validator object
function styleDefault(v) {
  if (v && typeof v === 'object' && 'defaultValue' in v) return v.defaultValue
  return undefined
}

// Helper: produce default from props object, with manual overrides for non-style fields
function buildDefaults(shapeProps, manualDefaults) {
  const result = {}
  for (const [key, validator] of Object.entries(shapeProps)) {
    const fromStyle = styleDefault(validator)
    if (fromStyle !== undefined) {
      result[key] = fromStyle
    } else if (key in manualDefaults) {
      result[key] = manualDefaults[key]
    }
    // else: field stays absent — caller must supply it (e.g., w/h)
  }
  // Merge manual overrides (including w/h which callers supply at shape-creation time)
  for (const [key, val] of Object.entries(manualDefaults)) {
    result[key] = val
  }
  return result
}

// Load @tldraw/tlschema (CJS, no DOM required)
const tlschema = req('@tldraw/tlschema')
const { geoShapeProps, noteShapeProps, textShapeProps, arrowShapeProps, createTLSchema, createShapeId } = tlschema
const { Store } = req('@tldraw/store')

// Validate each extracted default set by actually calling store.put
function validateViaStore(type, props) {
  const schema = createTLSchema()
  const store = new Store({
    schema,
    props: {
      defaultName: '',
      assets: { upload: async () => {}, resolve: async () => '', remove: async () => {} },
      users: { currentUser: { id: 'user:probe', name: 'probe' }, resolve: async () => ({}) },
    },
  })
  store.put([{ id: 'page:page', typeName: 'page', name: 'Page 1', index: 'a1', meta: {} }])
  const id = createShapeId('probe')
  store.put([{ id, typeName: 'shape', type, x: 0, y: 0, rotation: 0, index: 'a1', parentId: 'page:page', isLocked: false, opacity: 1, meta: {}, props }])
}

const richText = { type: 'doc', content: [] }

// geo: w/h are required at creation time by the caller (not truly default-able)
// We include w/h=100/100 as sentinel defaults — the engine always overrides them.
const geoDefaults = buildDefaults(geoShapeProps, {
  url: '',
  w: 100,
  h: 100,
  growY: 0,
  scale: 1,
  richText,
})

// note: no w/h
const noteDefaults = buildDefaults(noteShapeProps, {
  fontSizeAdjustment: 0,
  growY: 0,
  url: '',
  richText,
  scale: 1,
  textFirstEditedBy: null,
})

// text: w is caller-supplied; autoSize=true is the normal default
const textDefaults = buildDefaults(textShapeProps, {
  w: 100,
  richText,
  scale: 1,
  autoSize: true,
})

// arrow: start/end are caller-supplied terminal points
const arrowDefaults = buildDefaults(arrowShapeProps, {
  start: { x: 0, y: 0 },
  end: { x: 200, y: 0 },
  bend: 0,
  richText,
  labelPosition: 0.5,
  scale: 1,
  elbowMidPoint: 0.5,
})

const out = { geo: geoDefaults, note: noteDefaults, text: textDefaults, arrow: arrowDefaults }

// Validate all four via store.put — any missing/wrong prop will throw
const errors = []
for (const [type, props] of Object.entries(out)) {
  try {
    validateViaStore(type, props)
    console.log(`  [ok] ${type}`)
  } catch (e) {
    errors.push(`${type}: ${e.message}`)
    console.error(`  [FAIL] ${type}: ${e.message}`)
  }
}

if (errors.length > 0) {
  console.error('\nprobe-defaults FAILED — fix the defaults above')
  process.exit(1)
}

for (const t of WANTED) {
  if (!out[t]) {
    console.error(`missing defaults for '${t}'`)
    process.exit(1)
  }
}

const outPath = new URL('../src/defaults.json', import.meta.url)
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
console.log('wrote src/defaults.json for', Object.keys(out).join(', '))
process.exit(0)
