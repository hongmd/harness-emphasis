import type { Engine, TestBody } from "claude-code/testing";
import { expect, test } from "claude-code/testing";

const nbsp = " ";
const flush = (message_id: string, index: number, delta: string, final = false) => ({ turn_id: "t1", message_id, index, delta, final });
const compose = (surfaces: ("terminal" | "desktop" | "vscode" | "mobile")[]) =>
	({ model: "m", promptModel: "m", surfaces, tools: [], outputStyle: null, traits: [] }) as const;

test("the plugin draws a reply's pills without touching the stored row", async $ => {
	const first = await $.classic.MessageDisplay(flush("m1", 0, "## Verdict\n[[Done]] the split [`x`]\n"));
	expect(first.displayContent).toBe("## ⇒ Verdict\n`[✓ Done]` the split [`x`]\n");
	const second = await $.classic.MessageDisplay(flush("m1", 1, "[[Failed: 2]] left", true));
	expect(second.displayContent).toBe(`\`[✗ Failed:${nbsp}2]\` left`);
});

test("two messages streaming at once keep their own state", async $ => {
	const a = await $.classic.MessageDisplay(flush("a", 0, "[[Done", false));
	const b = await $.classic.MessageDisplay(flush("b", 0, "[[Needs you]]\n", false));
	expect(a.displayContent).toBe("");
	expect(b.displayContent).toBe(`\`[? Needs${nbsp}you]\`\n`);
	expect((await $.classic.MessageDisplay(flush("a", 1, "]] end", true))).displayContent).toBe("`[✓ Done]` end");
});

test("a new turn drops a state the interrupted reply left", async $ => {
	const aborted = await $.classic.MessageDisplay({ ...flush("m1", 0, "left [[Fail", false), turn_id: "t1" });
	expect(aborted.displayContent).toBe("");
	const next = await $.classic.MessageDisplay({ ...flush("m1", 0, "ed]] next\n", false), turn_id: "t2" });
	expect(next.displayContent).toBe("ed]] next\n");
});

const REPLY = { text: "## Verdict\n[[Done]] the split [`x`]\n", isFirstOfReply: true } as const;

// The drawing Claude Code makes is its own node, so what a rewrite came to is read at the hook
// beneath the plugin: the props as the chain handed them down. Registered before the first `$` call.
const rowText = (on: Parameters<TestBody>[1]) => {
	let text: string | undefined;
	on("ui.render", { component: "AssistantMessage" }, (_$, e, next) => {
		text = e.props.text;
		return next(e);
	});
	return async ($: Engine, props: { text: string; isFirstOfReply: boolean; isSummary?: true }) => {
		text = undefined;
		await $.ui.mount({ plugin: "emphasis", surface: "terminal", component: "AssistantMessage", props });
		return text;
	};
};

test("the transcript's own row is drawn too, so the fullscreen renderer shows it", async ($, on) => {
	const row = rowText(on);
	expect(await row($, REPLY)).toBe("## ⇒ Verdict\n`[✓ Done]` the split [`x`]\n");

	// A row MessageDisplay already drew must not gain a second glyph.
	expect(await row($, { ...REPLY, text: "`[✓ Done]` the split [`x`]\n" })).toBe("`[✓ Done]` the split [`x`]\n");
});

test("a summary row is left as stored", async ($, on) => {
	expect(await rowText(on)($, { text: "[[Done]]", isFirstOfReply: false, isSummary: true })).toBe("[[Done]]");
});

test("the rules come with the renderer, and only where something draws", async ($, on) => {
	on("prompt.compose", () => ({ sections: [{ id: "intro", text: "hi", scope: "session" }] }));

	const drawn = await $.prompt.compose(compose(["terminal"]));
	const section = drawn.sections.find(s => s.id === "emphasis:reply_style");
	expect(section?.scope).toBe("session");
	expect(section?.text).toContain("[[Needs you]]");

	const headless = await $.prompt.compose(compose([]));
	expect(headless.sections.map(s => s.id)).toEqual(["intro"]);
});

test("guidance off keeps the drawing and drops the rules", { options: { guidance: false } }, async ($, on) => {
	on("prompt.compose", () => ({ sections: [] }));
	const composed = await $.prompt.compose(compose(["terminal"]));
	expect(composed.sections.map(s => s.id)).not.toContain("emphasis:reply_style");
	expect((await $.classic.MessageDisplay(flush("m1", 0, "[[Done]]", true))).displayContent).toBe("`[✓ Done]`");
});

test("display off drops the drawing and the rules", { options: { display: false } }, async ($, on) => {
	on("prompt.compose", () => ({ sections: [] }));
	const row = rowText(on);
	const composed = await $.prompt.compose(compose(["terminal"]));
	expect(composed.sections.map(s => s.id)).not.toContain("emphasis:reply_style");
	expect((await $.classic.MessageDisplay(flush("m1", 0, "[[Done]]", true))).displayContent).toBeUndefined();
	expect(await row($, REPLY)).toBe(REPLY.text);
});
