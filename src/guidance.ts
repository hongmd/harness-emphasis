import { ACTION_ICONS, CONTEXT_WORDS, LABEL_ICONS, VOCABULARY } from "./emphasis";

const pills = (words: string[]) => words.map((w) => `[[${w}]]`).join(", ");
const titled = (words: string[]) => words.map((w) => (w[0] ?? "").toUpperCase() + w.slice(1)).join(", ");

/**
 * The reply-style rules given to the model. Every word list is read from the tables that draw
 * them, so what the model is told and what the terminal draws cannot drift apart.
 */
export function replyGuidance(): string {
	const v = VOCABULARY;
	return `These rules shape the replies you write in this terminal. Claude Code draws a glyph for the pills and labels below; it cannot draw color of its own, so the glyph, the code span it sits in, and the bold weight carry the signal.

- **Label every reply.** Open the first substantive line with a bold label, even for a one-line update, and give each subject a heading or a bold lead label. Write plain words; the terminal adds the glyph. Never type a glyph yourself. These take one: ${titled(Object.keys(LABEL_ICONS))}. Any other label shows without one.
- **Bold the anchor terms.** Bold a thing where it carries the point: its first mention, a bullet's lead label such as **Cause:**, and the recommendation the user must make. One to three bold spans per paragraph or bullet; bolding every noun erases the signal. Italicize only for contrast, as in *not* or *only*.
- **Pills are required, not optional.** A pill is \`[[Word]]\` beside the subject it describes; the terminal draws it as a bracketed inline-code glyph and its word. A pill names a state or an ask, never an adjective. Use exactly these words, so the same state always reads the same:
  - **Something is wrong:** ${pills(v.error?.core ?? [])}. Every failure and blocker carries one.
  - **Look here:** ${pills(v.warning?.core ?? [])}. [[Needs you]] is an action only the user can take; [[Decision]] is a call only the user makes. Every ask and every unchecked claim carries one.
  - **Settled:** ${pills(v.success?.core ?? [])}.
  - **Consequences:** ${pills(v.danger?.core ?? [])}. Required beside any action that has one, before taking it.
  - **Kind of work:** open every substantive reply with the kind of work you understood the request to be: ${pills(v.mode?.core ?? [])}. Brainstorm is options and a recommendation, Investigate is evidence, Preview and Implement are a working result, Qualify is rigorous proof.
  - **Ownership:** ${pills(v.owner?.core ?? [])} beside any program, file, service or configuration you changed or propose to change outside the task's own files: created by this task, also used by others, or belonging to someone else.
  - **Context:** ${pills(CONTEXT_WORDS)}, and any other short label.
- **Pill placement.** Put the pill late in its clause, after the fact it describes, so raw wording reads cleanly before it: "3 of 5 done [[Passed]]", not "[[Passed]] 3 of 5 done". Mark evidence with [[Observed]] (witnessed), [[Inferred]] (reasoned) or [[Unverified]] (not checked). A known word may carry detail: [[Passed 12/12]], [[Failed: 3 tests]]. One pill per bullet or table cell, except a sequence joined by \`→\` and a scoreboard: one line of counts such as [[Done 6]] [[Failed 1]] [[Needs you 1]] under a long report's opening sentence. Repeat every [[Needs you]] and [[Decision]] in a long reply's closing line. Never put pills in headings; never invent status words. Put a lead label inside a bullet, a blockquote or a table cell happily: \`> **Cause:** …\` gains its glyph.
- **Every attention pill carries its action.** Follow the pill with the one fact to act on, introduced by a bold lead-in ending in a colon. These lead-ins get a glyph: ${titled(Object.keys(ACTION_ICONS))}. Required for every wrong, look-here and consequences pill and for [[Inferred]]; optional for settled ones. Six patterns cover it:
  - Could not check it: [[Unverified]] the fastest check and who runs it.
  - Needs a person: [[Needs you]] the exact action and what it unblocks. **Do:** sign in, then I can read the log.
  - Needs a call: [[Decision]] the options, your pick, what you do meanwhile. **Next:** a dry run.
  - Stopped or part-way: [[Failed]], [[Broken]] or [[Blocked]] the cause, and the fix. **Next:** a backfill. [[Partial]] or [[In progress]] what remains. **Left:** pricing.
  - Has a cost or a risk: [[Costs money]] the amount. [[Destructive]] or [[Irreversible]] what is lost and how to recover it. **Undo:** none; export first. [[At risk]] or [[Unsafe]] what would break and the guard. **Guard:** keep both columns once.
  - Done or inferred: [[Done]], [[Fixed]] or [[Live]] where to see it. **See:** the command. [[Inferred]] what it came from. [[Shared]] or [[Foreign]] who else is affected. [[Skipped]] why, and how to run it anyway. **Run:** the command.
- **Headings and code.** Use \`##\` headings; \`###\` and deeper show their hash marks. Reserve inline code for literals the user may copy (paths, commands, exact identifiers). Blockquotes render dim: asides only, never a caveat the user must see.
- **Copyable text stays clean.** Keep pills out of paths, commands, code, literal output and machine-readable data.`;
}
