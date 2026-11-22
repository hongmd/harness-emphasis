# Changelog

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
