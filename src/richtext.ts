/**
 * richText helpers — headless plain ↔ ProseMirror (Task 5)
 *
 * toRich: delegates to tldraw's `toRichText` from @tldraw/tlschema (headless-safe,
 *         confirmed not to hang node in 5.1.1).
 * toPlain: pure in-house ProseMirror walker — no tiptap, no React, no DOM.
 *          Each top-level block (paragraph) → one line; text nodes joined, marks ignored.
 */

import { toRichText } from '@tldraw/tlschema'

export type RichText = { type: 'doc'; content: any[] }

/**
 * Convert a plain string to a tldraw RichText (ProseMirror doc).
 * Newlines become paragraph boundaries, matching tldraw's internal format.
 */
export function toRich(text: string): RichText {
  return toRichText(text) as RichText
}

/**
 * Convert a RichText (ProseMirror doc) back to a plain string.
 * Pure walker — no tiptap, no Editor, no DOM.
 * Each top-level block → one line; text node `.text` values are joined.
 * Marks (bold, italic, etc.) are ignored — the `.text` content survives.
 * Empty paragraph (no content array) → empty line.
 */
export function toPlain(rich: RichText): string {
  return (rich?.content ?? [])
    .map((block: any) =>
      (block.content ?? []).map((node: any) => node.text ?? '').join(''),
    )
    .join('\n')
}
