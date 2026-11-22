# Changelog

## [0.5.1] - 2026-11-22

### Fixed

- A pill written into a heading is drawn. Headings were passed through untouched, so `## 3. GitHub — fine — [[Observed]]` showed the raw brackets — the one thing the plugin exists to prevent. The heading's own icon is still taken from its text without the pill.

### Changed

- The rules told the model never to put a pill in a heading, which is why the shape was never exercised. A heading may carry one now.

[0.5.1]: https://github.com/hongmd/harness-emphasis/compare/v0.5.0...v0.5.1

## [0.5.0] - 2026-11-22

### Changed

- A pill is drawn inside square brackets — `[✓ Passed]` — so it reads apart from a lead label that carries the same glyph ("✓ Checked:"). The glyph alone was ambiguous on a line holding both, and on a scoreboard of bare counts. The brackets are ASCII, so they are in every monospace font and add no new width risk.

[0.5.0]: https://github.com/hongmd/harness-emphasis/compare/v0.4.1...v0.5.0

## [0.4.1] - 2026-11-22

### Fixed

- Every glyph is now one the plainest monospace font carries. Nine of them (`✚`, `★`, `◐`, `◑`, `↷`, `✎`, `↺`, `▣`, `◍`) were absent from JetBrains Mono Nerd Font, and four more added in 0.4.0 (`☑`, `⌕`, `※`, `▦`) were absent too, so they fell back to another font and could be drawn two cells wide — which shifts a whole reply when it wraps. The set is now limited to the arrow, geometric-shape and math-operator blocks, checked against the font's own character map rather than guessed.
- A lead label with no colon takes the action words, so `- **Check** the log` keeps the check the two-colon form already had.
- `TONE_GLYPHS` had a duplicate `neutral` key; removed.

[0.4.1]: https://github.com/hongmd/harness-emphasis/compare/v0.4.0...v0.4.1

## [0.4.0] - 2026-11-22

### Fixed

- A lead label inside a blockquote (`> **Cause:** …`) or a table's first cell gains its glyph, where before only a plain line or list item did.
- An accepted spelling no longer swallows the words after it. `[[down for maintenance]]` was drawn as the word "Down" and lost its prose; only a word replies are told to write takes detail after it (`[[Failed: 3 tests]]`), and an accepted spelling must be the whole label.
- `toneOf` now reads the longest vocabulary word a label opens with, so `[[error: 3 files]]` keeps the error tone and `[[Needs you]]` keeps its own.

### Changed

- The reply-style rules are about 240 tokens shorter, and tell the model to put a pill late in its clause, so the raw wording reads cleanly while a reply streams.
- Label glyphs no longer collide: Verdict `☑`, Rollback `↩`, Review `⌕`, Status `◈`, Evidence `◆`, Effect `⤳`, Why `※`, Limits `▽`, Scoreboard `▦`, Folder `▤`, Ideas `✧`. Pill glyphs: Foreign `◔`, Optional `◈`, Todo `□`, Draft `✎`. Every glyph is one cell wide.

[0.4.0]: https://github.com/hongmd/harness-emphasis/compare/v0.3.0...v0.4.0

## [0.3.0] - 2026-11-22

### Changed

- A pill is drawn as inline code instead of bold. Bold alone disappears where the terminal font's bold face sits close to its regular face, which left the glyph as the only signal; an inline code span takes the renderer's code color, so a pill reads apart in any font. Lead labels and headings keep bold.
- A pill's backticks reach the screen, so copying a reply with the mouse or `/copy` carries them. The stored message and ctrl+o are unchanged.

[0.3.0]: https://github.com/hongmd/harness-emphasis/compare/v0.2.0...v0.3.0

## [0.2.0] - 2026-11-22

### Fixed

- Glyphs now appear in the interactive terminal. The renderer drops a `MessageDisplay` hook's `displayContent` (anthropics/claude-code#83957), so a `ui.render` hook on `AssistantMessage` draws the transcript's own row from the same tables. Where both hooks reach the screen, `decorate` leaves an already-drawn line alone, so no glyph doubles. A summary row is left as stored.

### Changed

- `mise.toml` pins Node 26 and TypeScript 7. `src/` type-checks unchanged.

[0.2.0]: https://github.com/hongmd/harness-emphasis/compare/v0.1.1...v0.2.0

## [0.1.1] - 2026-11-22

### Fixed

- Icons no longer land inside inline code. A lead label such as `**Check:**` written between backticks is drawn as typed.
- Stream state now resets when the turn changes instead of in a `turn.complete` hook, which returned a shape the engine rejects and never fired on an interrupt. The warning printed on every turn is gone, and an interrupted reply no longer swallows the first words of the next one.

### Changed

- `mise run check` works: typecheck runs `tsc` on `src/` directly, and CI runs it beside test and validate.
- CI and release badges, a release procedure, and the corrected glyph table are in the README.

## [0.1.0] - 2026-11-22

First release. `[[Word]]` pills and known headings and lead labels are drawn with a glyph in the terminal, and a reply-style section tells the model which words to write. Display only: the stored message and the model's view keep the original Markdown.

[0.1.1]: https://github.com/hongmd/harness-emphasis/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/hongmd/harness-emphasis/releases/tag/v0.1.0
