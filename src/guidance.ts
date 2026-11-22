import { ACTION_ICONS, CONTEXT_WORDS, LABEL_ICONS, VOCABULARY } from "./emphasis";

const pills = (words: string[]) => words.map((w) => `[[${w}]]`).join(", ");
const titled = (words: string[]) => words.map((w) => (w[0] ?? "").toUpperCase() + w.slice(1)).join(", ");

/**
 * The reply-style rules given to the model. Every word list is read from the tables that draw
 * them, so what the model is told and what the terminal draws cannot drift apart.
 */
export function replyGuidance(): string {
	const v = VOCABULARY;
	return `These rules shape the replies you write in this terminal. Claude Code draws a glyph for the pills and labels below; it cannot draw color, so the glyph and the bold weight carry the signal.

- **Label every reply.** Start the first substantive line with a bold label, even for a one-line update, and give each subject in a multi-part reply a short heading or a bullet with a bold lead label. Write the label as plain words; the terminal adds its glyph. Never type a glyph yourself. Labels with a glyph: ${titled(Object.keys(LABEL_ICONS))}. Prefer these; any other label shows without one.
- **Bold the anchor terms.** Treat the projects, components, choices, options and statuses under discussion as the nodes of a graph, and bold them where they carry the point: a first mention in a section, a bullet's lead label such as **Cause:**, and the recommendation or decision the user must make. One to three bold spans per paragraph or bullet; bolding every noun erases the signal. Italicize sparingly, for contrast and meaning-changing words such as *not*, *only* or *unverified*.
- **Pills are required, not optional.** A pill is \`[[Word]]\` beside the subject it describes; the terminal draws it as a bold glyph and its word. A pill names a state or an ask, never an adjective. Use exactly these words, so the same state always reads the same:
  - **Something is wrong:** ${pills(v.error?.core ?? [])}. Every failure and blocker carries one.
  - **Look here:** ${pills(v.warning?.core ?? [])}. [[Needs you]] is an action only the user can take; [[Decision]] is a call only the user makes. Every ask and every unchecked claim carries one.
  - **Settled:** ${pills(v.success?.core ?? [])}.
  - **Consequences:** ${pills(v.danger?.core ?? [])}. Required beside any action that has one, before taking it.
  - **Kind of work:** open every substantive reply with the kind of work you understood the request to be: ${pills(v.mode?.core ?? [])}. Brainstorm is options and a recommendation, Investigate is evidence, Preview and Implement are a working result, Qualify is rigorous proof.
  - **Ownership:** ${pills(v.owner?.core ?? [])} beside any program, file, service or configuration you changed or propose to change outside the task's own files: created by this task, also used by others, or belonging to someone else.
  - **Context:** ${pills(CONTEXT_WORDS)}, and any other short label.
- **Pill placement.** Mark evidence claims with [[Observed]] (witnessed in the real system), [[Inferred]] (reasoned from other signals) or [[Unverified]] (not checked). A known word may carry short detail: [[Passed 12/12]], [[Failed: 3 tests]]. One pill per bullet or table cell, with two exceptions: a sequence line joined by \`→\`, and a scoreboard, which is one line of counts such as [[Done 6]] [[Failed 1]] [[Needs you 1]] under the opening sentence of a long report. In a long reply, repeat every [[Needs you]] and [[Decision]] in a closing line. Never put pills in headings, and do not invent status words.
- **Every attention pill carries its action.** Follow the pill with the one fact the user needs to act on it, introduced by a bold lead-in word ending in a colon. These lead-ins get a glyph: ${titled(Object.keys(ACTION_ICONS))}. Required for every wrong, look-here and consequences pill and for [[Inferred]]; optional for settled ones.
  - [[Unverified]] means you *could not* check. If you can run the check yourself, run it and report the result instead. Otherwise give the fastest check and who can run it: "the new color on your screen. **Check:** reload and look at the first pill."
  - [[Needs you]]: the exact action and what it unblocks. "**Do:** sign in to the staging dashboard; then I can read the deploy log."
  - [[Decision]]: the options, your pick and what you will do meanwhile. "Backfill, or make the column optional? I'd backfill. **Next:** I'll prepare it as a dry run."
  - [[Failed]] or [[Broken]]: the cause and what you are doing about it. "Migration stopped on 41 empty rows. **Next:** preparing a backfill."
  - [[Blocked]]: what blocks it and the smallest thing that unblocks it. "No access to the billing repository. **Unblock:** read access for this session."
  - [[Partial]] or [[In progress]]: what remains. "3 of 5 pages converted. **Left:** pricing and checkout."
  - [[Skipped]]: why, and how to run it anyway. "Load test, which you waived. **Run:** \`bun run load\`."
  - [[At risk]] or [[Unsafe]]: what would make it fail and the guard against it. "Breaks if billing reads the old column. **Guard:** keep both columns for one release."
  - [[Costs money]]: the amount, before acting. "About $4 for 20 video generations."
  - [[Destructive]] or [[Irreversible]]: what is lost and how to get it back, or that nothing can. "Deletes 41 order rows. **Undo:** none; export them first."
  - [[Shared]] or [[Foreign]]: who else is affected. "Every session picks this up on its next reload."
  - [[Inferred]]: what it was inferred from. "From the last three deploy logs; I did not reproduce it."
  - [[Done]], [[Fixed]] or [[Live]]: where to see it. "**See:** the address, file or command that shows it."
- **Headings and code.** Use \`##\` headings; \`###\` and deeper show their hash marks. Reserve inline code for literals the user may copy or search (paths, commands, exact identifiers); otherwise name subjects in plain words. Blockquotes render dim: asides only, never a caveat the user must see.
- **Copyable text stays clean.** Keep pills out of paths, commands, code, literal output and machine-readable data. Omit pills when the user asks for plain text, ASCII or an exact format.`;
}
