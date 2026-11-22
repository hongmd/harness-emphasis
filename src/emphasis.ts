// Display-only emphasis for Claude Code replies.
//
//   [[Blocked]]       becomes an inline-code step marker, a glyph chosen by its word
//   ## Verdict        a known heading keeps its word and gains a glyph
//   **Cause:**        a known lead label gains a glyph at the start, and anywhere with a colon
//
// The stored message, ctrl+o, copied text and the model's view keep the original Markdown:
// Claude Code draws this text in place of the streamed delta and nowhere else.

export type Tone = "success" | "error" | "warning" | "danger" | "mode" | "owner" | "neutral";

/** Each tone's words. `core` are the words replies are told to write; `also` are accepted and colored the same. */
export const VOCABULARY: Record<Exclude<Tone, "neutral">, { core: string[]; also: string[] }> = {
	error: {
		core: ["Failed", "Blocked", "Broken", "Unsafe"],
		also: ["fail", "failing", "error", "rejected", "down"],
	},
	warning: {
		core: ["Needs you", "Decision", "Unverified", "Partial", "Skipped", "In progress", "Pending", "At risk"],
		also: ["needs review", "waiting", "review", "todo", "stale", "draft"],
	},
	success: {
		core: ["Done", "Passed", "Observed", "Fixed", "Live", "Recommended", "Keep"],
		also: ["pass", "ready", "merged", "safe", "verified", "shipped", "ok", "approved", "complete", "completed", "finished", "healthy"],
	},
	danger: { core: ["Costs money", "Destructive", "Irreversible"], also: [] },
	mode: { core: ["Brainstorm", "Investigate", "Preview", "Implement", "Qualify"], also: [] },
	owner: { core: ["Owned", "Shared", "Foreign"], also: [] },
};

/** Words colored neutral like any unknown label, but given a glyph and a place in the guidance. */
export const CONTEXT_WORDS = ["Inferred", "New", "Changed", "Optional"];

const TONE_WORDS = Object.fromEntries(
	Object.entries(VOCABULARY).map(([tone, words]) => [tone, [...words.core, ...words.also].map((w) => w.toLowerCase())]),
) as Record<Exclude<Tone, "neutral">, string[]>;

// Every glyph here is one cell wide, drawn from the blocks a monospace font is expected to carry
// (arrows, geometric shapes, math operators), and no emoji — so no font beyond the terminal's own.
const CHECK = "✓";
const CROSS = "✗";
const ATTENTION = "?";
/** The glyph each known pill word carries. A word without one takes its tone's glyph. */
const PILL_ICONS: Record<string, string> = {
	// Settled.
	done: CHECK, passed: CHECK, pass: CHECK, complete: CHECK, completed: CHECK, ok: CHECK,
	verified: CHECK, ready: CHECK, healthy: CHECK, safe: CHECK, approved: CHECK, merged: CHECK,
	fixed: "⊞", observed: "◉", review: "◉", live: "▶", shipped: "▶", recommended: "⋆", keep: "⋆",
	// Something is wrong.
	failed: CROSS, fail: CROSS, failing: CROSS, error: CROSS,
	rejected: "⊘", blocked: "■", broken: "⊗", unsafe: "‼", down: "↓",
	// Look here.
	"needs you": ATTENTION, decision: ATTENTION, unverified: "▲", "at risk": "▲",
	"in progress": "◕", partial: "◔", skipped: "↦", pending: "○", waiting: "○",
	todo: "□", draft: "▫", stale: "↭",
	// Consequences.
	"costs money": "$", destructive: "⊗", irreversible: "‼",
	// Kind of work.
	brainstorm: "◇", investigate: "◎", preview: "⊙", implement: "⊟", qualify: "◈",
	// Ownership.
	owned: "●", shared: "◩", foreign: "◔",
	// Context.
	inferred: "◌", new: "⊕", changed: "∆", optional: "◈",
};

/** The glyph a pill takes when its word has no entry: one per tone, so an unknown word still reads as a pill. */
const TONE_GLYPHS: Record<Tone, string> = {
	success: CHECK,
	error: CROSS,
	warning: ATTENTION,
	danger: "‼",
	mode: "◇",
	owner: "●",
	neutral: "●",
};

/** Words that display as one canonical word, so the same state always reads the same. */
const SYNONYMS: Record<string, string> = {
	complete: "Done", completed: "Done", ok: "Done", finished: "Done",
	pass: "Passed", fail: "Failed", failing: "Failed", error: "Failed",
	waiting: "Pending", "needs review": "Review",
};

/** The glyph a heading or a line's leading bold label takes from its word. */
export const LABEL_ICONS: Record<string, string> = {
	finding: "◉", result: "▶", status: "◈", evidence: "◆", cause: "∆", effect: "↦",
	fix: "⊞", risk: "▲", limits: "▽", cost: "$", decision: ATTENTION, options: "◇",
	plan: "⊟", next: "→", why: "∵", how: "◎", rule: "§", example: "✶",
	checked: CHECK, verdict: "⇒", rollback: "↩", undo: "↪", review: "⌫",
	scoreboard: "⊡", terminal: "▸", folder: "❱", file: "▪", branch: "⋎",
	ideas: "◊", pills: "●", colors: "◩", icons: "⋆",
};

/** Lead-in words that name the action a pill calls for. With a colon they take a glyph anywhere in a line. */
export const ACTION_ICONS: Record<string, string> = {
	check: CHECK, do: "→", next: "→", unblock: "◇", left: "◕", run: "▶", guard: "▲", undo: "↪", see: "◉",
};

const KNOWN = [...new Set([...Object.values(TONE_WORDS).flat(), ...Object.keys(PILL_ICONS), ...Object.keys(SYNONYMS)])]
	.sort((a, b) => b.length - a.length);
/** The words replies are told to write; only these take detail after them. */
const CORE = new Set(Object.values(VOCABULARY).flatMap((tone) => tone.core.map((w) => w.toLowerCase())));

/** True when the text opens with a letter, so no glyph of its own stands there already. */
const opensWithWord = (text: string) => /^\p{L}/u.test(text);

/** A pill label read as its word: a known word may be followed by detail ("Passed 12/12", "Failed: 3 tests"). */
export function splitLabel(label: string): { glyph: string | undefined; word: string; key: string } {
	const text = label.replace(/\s+/g, " ").trim();
	const lower = text.toLowerCase();
	// A core word may carry detail ("Failed: 3 tests"). An accepted spelling must be the whole label, so
	// ordinary prose ("down for maintenance") is not read as one, and still reads as its own words.
	const known = KNOWN.find(
		(k) => lower === k || (CORE.has(k) && lower.startsWith(k) && /[ :]/.test(lower[k.length] ?? "")),
	);
	const canonical = known ? SYNONYMS[known] : undefined;
	const key = (canonical ?? known ?? lower).toLowerCase();
	const word = canonical && known ? canonical + text.slice(known.length) : text;
	const glyph = opensWithWord(text) ? PILL_ICONS[key] : undefined;
	return { glyph, word, key };
}

export function toneOf(label: string): Tone {
	// The longest vocabulary word the label opens with decides the tone, so "error: 3 files" reads as a
	// failure and "Needs you" keeps its tone, even though neither is a whole label of the vocabulary.
	const text = label.replace(/\s+/g, " ").trim().toLowerCase();
	const key = KNOWN.find((k) => text === k || (text.startsWith(k) && /[ :]/.test(text[k.length] ?? ""))) ?? text;
	for (const tone of ["danger", "error", "warning", "success", "mode", "owner"] as const) {
		if (TONE_WORDS[tone].includes(key)) return tone;
	}
	return "neutral";
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^( {0,3}#{1,6}\s+)(.+)$/;
// A line's leading bold label, after an optional list marker, and inside a blockquote or a table cell.
const LEAD_LABEL = /^(\s*(?:>\s*)*(?:\|+\s*)?(?:[-*+]|\d+\.)?\s*\*\*)([^*`\n]{1,32})(\*\*)/;
// A [[pill]] of 1-32 characters, not escaped and not holding brackets or a newline.
const PILL = /(?<!\\)\[\[([^[\]\n]{1,32})\]\]/g;
const ACTION_LABEL = new RegExp(`(\\*\\*)(${Object.keys(ACTION_ICONS).join("|")})(:\\*\\*)`, "gi");
// Even parts are prose; odd ones are inline code and stay untouched.
const CODE_SPAN = /(`+[^`]*?`+)/g;

/** Prefix a known label with its glyph, unless the text opens with a glyph already. */
function withLabelIcon(label: string, action = false): string {
	const word = label.replace(/[:\s]+$/, "").trim().toLowerCase();
	// A lead label at the start of a line falls back to the action words, so "- **Check** is the log"
	// keeps the key its two-colon form has.
	const glyph = !opensWithWord(label) ? undefined : (LABEL_ICONS[word] ?? ACTION_ICONS[word] ?? (action ? ACTION_ICONS[word] : undefined));
	return glyph ? `${glyph} ${label}` : label;
}

/**
 * One pill as Markdown: inline code, so it carries the renderer's own code color, with a glyph from
 * its word and its words held together by no-break spaces. The square brackets inside the span are
 * what tell a pill from a lead label carrying the same glyph ("[\u2713 Passed]" against "\u2713 Checked:"),
 * and ASCII is in every monospace font.
 */
export function pill(label: string): string {
	if (!label.trim()) return `[[${label}]]`;
	const { glyph, word } = splitLabel(label);
	const tone = toneOf(label);
	const mark = glyph ?? TONE_GLYPHS[tone];
	const text = word.replace(/ /g, "\u00a0");
	return `\`[${mark} ${text}]\``;
}

/** Apply emphasis to one line of prose, leaving inline code and escaped markers as typed. */
function decorateLine(line: string): string {
	// Split on inline code first: an icon must never land inside a backtick span.
	return line
		.split(CODE_SPAN)
		.map((part, index) => {
			if (index % 2 === 1) return part;
			let result = part.replace(PILL, (_, label: string) => pill(label));
			result = result.replace(ACTION_LABEL, (match, before: string, word: string, after: string) => {
				const glyph = ACTION_ICONS[word.toLowerCase()];
				return glyph ? `${before}${glyph} ${word}${after}` : match;
			});
			return result.replace(LEAD_LABEL, (_, before: string, label: string, after: string) => before + withLabelIcon(label) + after);
		})
		.join("");
}

/** Apply emphasis to Markdown, leaving fenced code and headings' own pills alone. `ctx` carries a fence across calls. */
export function decorate(markdown: string, ctx: { fence?: string } = {}): string {
	return markdown
		.split("\n")
		.map((line) => {
			const fenceMatch = FENCE.exec(line);
			const open = fenceMatch?.[1];
			if (ctx.fence !== undefined) {
				if (open !== undefined && open[0] === ctx.fence[0] && open.length >= ctx.fence.length) ctx.fence = undefined;
				return line;
			}
			if (open !== undefined) {
				ctx.fence = open;
				return line;
			}
			const heading = HEADING.exec(line);
			if (heading) return heading[1] + withLabelIcon(heading[2] as string);
			return decorateLine(line);
		})
		.join("\n");
}

/**
 * Emphasis for one message's stream. A pill can land across two flushes, so the tail of the
 * last line is held until the next flush, and a fence opened here closes in a later one.
 *
 * shortcut: state lives in this object, which a hot reload drops, so a reload mid-message can
 * show a split pill as typed; upgrade if reloads while a reply streams turn out to be common.
 */
export class Emphasizer {
	private carry = "";
	private ctx: { fence?: string } = {};

	/** The display text for one flush of a message. Never throws: a broken decoration shows the text as typed. */
	push(delta: string, final: boolean): string {
		const buffer = this.carry + delta;
		const cut = final ? buffer.length : buffer.lastIndexOf("\n") + 1;
		const ready = buffer.slice(0, cut);
		this.carry = buffer.slice(cut);
		try {
			return decorate(ready, this.ctx);
		} catch {
			// The text is shown as typed rather than lost: a flush is the only place this text exists.
			return ready;
		}
	}
}
