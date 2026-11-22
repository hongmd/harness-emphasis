# Emphasis

Replies you can scan. This Claude Code plugin turns `[[Done]]`, `[[Failed]]` and `[[Needs you]]` into bold glyphs, gives known headings and lead labels an icon from their word, and teaches the model to write them.

```text
## Verdict            →   ## § Verdict
[[Done]] 12/12       →   ✓ Done 12/12   (bold)
**Cause:** the lock  →   ∆ Cause: the lock
```

It changes only what is drawn. The stored message, ctrl+o, copied text and the model's own view of the conversation keep the original Markdown.

## Why glyphs and not colors

Claude Code draws an assistant reply through its own Markdown renderer. `MessageDisplay` can replace the text shown while a reply streams, but that text is drawn as Markdown with control characters stripped, so a plugin cannot set a background color. Emphasis therefore carries tone with a one-cell glyph and bold weight, which works in every terminal with no extra font.

## Install

Add this repository as a marketplace and install from it:

```sh
/plugin marketplace add hongmd/harness-emphasis
/plugin install emphasis@harness-emphasis
```

From a shell:

```sh
claude plugin marketplace add hongmd/harness-emphasis
claude plugin install emphasis@harness-emphasis
```

Then start a new session. For a local checkout, point the marketplace at the folder instead: `claude plugin marketplace add /path/to/harness-emphasis`. To try it without installing:

```sh
claude --plugin-dir /path/to/harness-emphasis
```

## Pills

Write `[[Word]]` beside the thing it describes. The word chooses the glyph.

| Glyph by default | Meaning | Words |
|---|---|---|
| `✓` | Settled | Done, Passed, Observed, Fixed, Live, Recommended, Keep |
| `✗` | Something is wrong | Failed, Blocked, Broken, Unsafe |
| `?` | Look here | Needs you, Decision, Unverified, Partial, Skipped, In progress, Pending, At risk |
| `‼` | Consequences | Costs money, Destructive, Irreversible |
| `◇` | Kind of work | Brainstorm, Investigate, Preview, Implement, Qualify |
| `●` | Ownership | Owned, Shared, Foreign |
| `●` | Context | Inferred, New, Changed, Optional |

- **Detail.** A known word may be followed by detail: `[[Passed 12/12]]`, `[[Failed: 3 tests]]`, `[[In progress 40%]]`.
- **Synonyms.** Completed, Complete, OK and Finished display as Done. Fail, Failing and Error display as Failed. Pass displays as Passed, Waiting as Pending, and Needs review as Review.
- **Unknown words.** Any other short label still reads as a bold pill with its tone's glyph, so nothing is left as raw brackets.
- **Length.** A label can be up to 32 characters. Longer ones are left as typed.

## Labels

- **Headings.** A `##` heading takes an icon when its word is one of: Finding, Result, Status, Evidence, Cause, Effect, Fix, Risk, Limits, Cost, Decision, Options, Plan, Next, Why, How, Rule, Example, Checked, Verdict, Rollback, Undo, Review, Scoreboard, Terminal, Folder, File, Branch, Ideas, Pills, Colors, Icons.
- **Lead labels.** Bold text that opens a line or list item takes the same icon: `**Cause:** the lock`.
- **Action lead-ins.** Bold **Check:**, **Do:**, **Next:**, **Unblock:**, **Left:**, **Run:**, **Guard:**, **Undo:** and **See:** take an icon anywhere in a line, so the action that follows a pill is easy to find.

Your own messages, inline code, fenced code and escaped brackets are left alone. Pills inside a fence are never drawn, and a fence opened in one streaming flush and closed in the next is respected.

## The rules come with it

An agent writes pills only when it is told how. The plugin adds a `emphasis:reply_style` section to the system prompt, so there is nothing to paste into `CLAUDE.md`. The section tells the model:

- which words to use for each tone, and that every failure, ask and unchecked claim needs its pill
- to open a reply with the kind of work it understood, and to mark consequences and ownership
- to follow each attention pill with the action it calls for, such as the fastest check after `[[Unverified]]`
- to write labels as plain words, because the terminal adds the icons

The word lists in that section are read from the same tables that draw the pills, so the rules and the drawing cannot drift apart. Print, JSON and headless runs get no section, since nothing there draws pills.

## Settings

Set them from `/plugin` → Emphasis, or in `~/.claude/settings.json` under `pluginConfigs`:

| Field | Default | Effect |
|---|---|---|
| `display` | on | Draw pills and label glyphs in the reply on screen |
| `guidance` | on | Add the reply-style section to the system prompt |

To keep the drawing and write your own rules, turn `guidance` off.

## Limits

- The drawing replaces text on screen only. The stored message, ctrl+o, copied text and the model's view keep the original Markdown.
- Color cannot be set; tone is carried by glyph and weight.
- The no-break spaces inside a pill keep its words together on one line when the reply wraps.
- Checked on macOS; tests run in CI on Linux. Claude Code 2.1.330.

## Development

```sh
mise install
mise run test       # the rules, without Claude Code running
mise run validate   # what the engine will refuse
```

Claude Code writes its own type declarations into `.claude-plugin/types/` the first time a session loads this plugin; after that `mise run typecheck` checks the code against them. CI runs `mise run test` and `mise run validate` on every push and pull request — typecheck needs those declarations, which only a logged-in session lays down, so it stays a local check.

The rules all live in `src/emphasis.ts` and are tested without Claude Code running. `src/guidance.ts` holds the prompt section and reads its word lists from the same tables.

### Releases

The version lives in `.claude-plugin/plugin.json` (and is mirrored in `package.json`). Bump both, push to `main`, and CI tags that commit `v<version>` and publishes a GitHub release with generated notes. A version that already has a release is left alone, so merging does not re-tag.

## Credits

An idea taken from [pi-emphasis](https://github.com/johnlindquist/pi-emphasis), rewritten for Claude Code's plugin API. The vocabulary, the placement rules and the action lead-ins are theirs; the glyph-only rendering is this plugin's.
