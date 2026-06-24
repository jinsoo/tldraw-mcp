/**
 * One-off authoring script: generates docs/neaSCAN_optics.tldr
 * Run: cd tools/tldraw-mcp && node scripts/gen-optics.mjs
 * Uses pre-built dist/ (npm run build must have been run already).
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { fromScene } from '../dist/sceneSpec.js'
import { writeTldrFile } from '../dist/tldrFile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../../../docs/neaSCAN_optics.tldr')

// neaSCAN optical bench (top view) — 2 interferometer arms + 2 MCT detectors
// Authority: wiki/topics/optical-bench-detectors.md (4× confirmed 2026-06-20)
const scene = {
  title: 'neaSCAN optical bench (top view)',
  nodes: [
    // MIR illumination unit
    {
      id: 'src',
      kind: 'box',
      text: 'MIR source\n(broadband id3 / QCL id6)',
      x: 40,
      y: 180,
      w: 160,
      h: 70,
      color: 'orange',
    },
    // ZnSe MIR beamsplitter — NOT glass (glass absorbs MIR)
    {
      id: 'znse',
      kind: 'box',
      shape: 'diamond',
      text: 'ZnSe MIR BS',
      x: 260,
      y: 180,
      w: 100,
      h: 70,
      color: 'violet',
    },
    // Gold OAP (off-axis parabolic mirror) — reflective MIR focusing
    {
      id: 'oap',
      kind: 'box',
      shape: 'ellipse',
      text: 'OAP\n(gold, reflective focus)',
      x: 420,
      y: 180,
      w: 100,
      h: 70,
      color: 'yellow',
    },
    // Central AFM tip — shared by both arms
    {
      id: 'tip',
      kind: 'box',
      shape: 'diamond',
      text: 'AFM tip\n(shared, neaSNOM head)',
      x: 580,
      y: 180,
      w: 130,
      h: 70,
      color: 'red',
    },
    // LEFT arm: Kolmar Technologies KLD-0.1-J1/11 MCT — CURRENT primary
    // Covers PsHet (dither) + nanoFTIR (400 µm sweep); active since 2023
    {
      id: 'kolmar',
      kind: 'box',
      text: 'Kolmar MCT\nLEFT arm\n(PsHet + nanoFTIR, current)',
      x: 580,
      y: 20,
      w: 150,
      h: 90,
      color: 'blue',
    },
    // RIGHT arm: InfraRed Associates IRA-20-00103 MCT — LEGACY
    // Old broadband nanoFTIR path (2017-2021); now idle
    {
      id: 'ira',
      kind: 'box',
      text: 'IRA MCT\nRIGHT arm\n(legacy broadband, idle)',
      x: 580,
      y: 340,
      w: 150,
      h: 90,
      color: 'green',
    },
    // Kolmar arm reference mirror — upper/lower dither+sweep
    {
      id: 'ref-kolmar',
      kind: 'box',
      shape: 'ellipse',
      text: 'Ref mirror\n(dither / 400 µm sweep)',
      x: 340,
      y: 20,
      w: 140,
      h: 70,
      color: 'light-blue',
    },
    // IRA arm reference mirror — lateral delay-line
    {
      id: 'ref-ira',
      kind: 'box',
      shape: 'ellipse',
      text: 'Ref mirror\n(lateral delay-line)',
      x: 340,
      y: 360,
      w: 140,
      h: 70,
      color: 'light-green',
    },
    // Annotation note
    {
      id: 'note-timeline',
      kind: 'note',
      text: '2023 SAT MIR Upgrade:\nQCL id6 installed -> PsHet/Kolmar primary\n(nanoFTIR/IRA -> legacy)',
      x: 60,
      y: 360,
      color: 'yellow',
    },
  ],
  edges: [
    // MIR beam: source -> ZnSe BS -> OAP -> tip
    { from: 'src', to: 'znse', text: 'MIR beam' },
    { from: 'znse', to: 'oap' },
    { from: 'oap', to: 'tip' },
    // Back-scattered signal from tip -> detectors (dashed = returning signal)
    { from: 'tip', to: 'kolmar', text: 'back-scatter', dash: 'dashed' },
    { from: 'tip', to: 'ira', text: 'back-scatter', dash: 'dashed' },
    // ZnSe BS splits toward reference arms
    { from: 'znse', to: 'ref-kolmar', text: 'ref arm L', dash: 'dotted' },
    { from: 'znse', to: 'ref-ira', text: 'ref arm R', dash: 'dotted' },
  ],
}

const store = fromScene(scene)
writeFileSync(OUT, writeTldrFile(store))
console.log(`Written: ${OUT}`)
console.log(`Nodes: ${scene.nodes.length}, Edges: ${scene.edges.length}`)
