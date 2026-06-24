import { readFileSync, writeFileSync } from 'node:fs'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { readTldrFile, writeTldrFile } from './tldrFile.js'
import { fromScene, mergeScene, toScene, validateScene } from './sceneSpec.js'
import { PERMANENT_INSTRUCTIONS } from './prompt.js'

export function listTools() {
  const sceneProp = { type: 'object', description: 'scene-spec (nodes/edges). ' + PERMANENT_INSTRUCTIONS }
  return [
    {
      name: 'read_tldr',
      description: 'Read a .tldr file → scene-spec (+unmodeled). ' + PERMANENT_INSTRUCTIONS,
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'write_tldr',
      description:
        'Write/merge a scene-spec → .tldr file. Existing file = merge-not-replace. ' +
        PERMANENT_INSTRUCTIONS,
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          scene: sceneProp,
          mode: { type: 'string', enum: ['auto', 'create', 'edit'] },
        },
        required: ['path', 'scene'],
      },
    },
    {
      name: 'validate_tldr',
      description: 'Validate a scene-spec. ' + PERMANENT_INSTRUCTIONS,
      inputSchema: {
        type: 'object',
        properties: { scene: sceneProp },
        required: ['scene'],
      },
    },
  ]
}

export async function handleTool(name: string, args: any): Promise<any> {
  if (name === 'validate_tldr') return validateScene(args.scene)

  if (name === 'read_tldr') {
    return toScene(readTldrFile(readFileSync(args.path, 'utf8')).store)
  }

  if (name === 'write_tldr') {
    const fileExists = (() => {
      try {
        readFileSync(args.path)
        return true
      } catch {
        return false
      }
    })()
    const mode =
      args.mode && args.mode !== 'auto' ? args.mode : fileExists ? 'edit' : 'create'
    let store: any
    if (mode === 'edit' && fileExists) {
      store = mergeScene(readTldrFile(readFileSync(args.path, 'utf8')).store, args.scene)
    } else {
      store = fromScene(args.scene)
    }
    writeFileSync(args.path, writeTldrFile(store))
    return { ok: true, path: args.path, mode }
  }

  throw new Error(`unknown tool: ${name}`)
}

async function main() {
  const server = new Server(
    { name: 'tldraw-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listTools() }))
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const out = await handleTool(req.params.name, req.params.arguments ?? {})
    return { content: [{ type: 'text', text: JSON.stringify(out) }] }
  })
  await server.connect(new StdioServerTransport())
}

// Only run the server when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) main()
