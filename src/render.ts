/**
 * render.ts — authoring-time SVG export via REAL tldraw rendering.
 *
 * ISOLATION CONTRACT: This module is the ONLY place chromium is used. The engine
 * runtime (tldrawApi, tldrFile, sceneSpec, richtext, index) must NEVER import this
 * module. Render is L2 display only — a blocked render never blocks L1.
 *
 * Implementation: shells out to `@kitschpatrol/tldraw-cli`, which serves a headless
 * real tldraw instance, loads our standard `.tldr` envelope (the same file our
 * engine writes via writeTldrFile), and exports an SVG that matches tldraw.com —
 * real shape geometry, rendered text labels, real arrow paths, bindings honoured.
 *
 * Render runs at AUTHORING time on the dev box, which HAS network and a
 * chromium-capable host, so loading/serving real tldraw is fine. This is NOT a
 * hand-rolled SVG drawer — every glyph and path comes from tldraw itself.
 */
import { readFile, mkdtemp, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Locate an installed package's root directory by walking up from this module
 * through ancestor `node_modules`. Avoids `require.resolve`, which fails when the
 * dependency restricts its `exports` to ESM-only conditions (as tldraw-cli does).
 */
async function findPackageRoot(pkgName: string): Promise<string> {
  const segments = pkgName.split('/')
  let dir = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    const candidate = join(dir, 'node_modules', ...segments)
    try {
      await access(join(candidate, 'package.json'))
      return candidate
    } catch {
      // not here — walk up
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error(`cannot find node_modules/${pkgName} above ${import.meta.url}`)
}

/**
 * Render a `.tldr` file to an SVG string using real tldraw.
 *
 * Shells out to `@kitschpatrol/tldraw-cli`, which boots a headless tldraw editor
 * (via puppeteer/chromium), loads the `.tldr` envelope, and exports SVG. The
 * resulting SVG is read from disk and returned. The output is byte-identical to
 * what tldraw.com would render for the same document (modulo font embedding).
 *
 * Runs at authoring time only — never imported by the prod viewer runtime.
 *
 * @param tldrPath - Absolute path to a `.tldr` file (our standard envelope:
 *                   { tldrawFileFormatVersion: 1, schema, records: [...] }).
 * @returns SVG string starting with `<svg`, rendered by real tldraw.
 */
export async function renderToSvg(tldrPath: string): Promise<string> {
  // Resolve the tldraw-cli entrypoint from this package's node_modules so the
  // call works regardless of the caller's cwd or global npm state. The package
  // restricts its `exports` to ESM-only conditions, so we locate its root by
  // walking up node_modules, then read package.json to find the declared `bin`.
  const PKG = '@kitschpatrol/tldraw-cli'
  let cliBin: string
  try {
    const pkgRoot = await findPackageRoot(PKG)
    const pkg = JSON.parse(await readFile(join(pkgRoot, 'package.json'), 'utf8')) as {
      bin?: string | Record<string, string>
    }
    const binRel =
      typeof pkg.bin === 'string'
        ? pkg.bin
        : (pkg.bin?.['tldraw'] ?? pkg.bin?.['tldraw-cli'] ?? Object.values(pkg.bin ?? {})[0])
    if (binRel == null) throw new Error('tldraw-cli has no bin entry')
    cliBin = join(pkgRoot, binRel)
  } catch (err) {
    throw new Error(
      `${PKG} not resolvable (authoring-time dep): ${(err as Error).message}`,
    )
  }

  // Export into a throwaway directory; tldraw-cli writes <name>.svg there.
  const outDir = await mkdtemp(join(tmpdir(), 'tldraw-render-'))
  try {
    await execFileAsync(
      process.execPath,
      [
        cliBin,
        'export',
        tldrPath,
        '--format',
        'svg',
        '--output',
        outDir,
        '--name',
        'render',
      ],
      {
        // Chromium can be slow to boot the first time; give it room.
        timeout: 120_000,
        maxBuffer: 64 * 1024 * 1024,
        env: process.env,
      },
    )

    const svg = await readFile(join(outDir, 'render.svg'), 'utf8')
    if (!svg.startsWith('<svg')) {
      throw new Error('tldraw-cli produced output that does not start with <svg')
    }
    return svg
  } finally {
    await rm(outDir, { recursive: true, force: true }).catch(() => undefined)
  }
}
