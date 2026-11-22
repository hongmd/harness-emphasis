import { expect, test } from "claude-code/testing";

const nbsp = " ";
const flush = (message_id: string, index: number, delta: string, final = false) => ({ turn_id: "t1", message_id, index, delta, final });
const compose = (surfaces: ("terminal" | "desktop" | "vscode" | "mobile")[]) =>
	({ model: "m", promptModel: "m", surfaces, tools: [], outputStyle: null, traits: [] }) as const;

test("the plugin draws a reply's pills without touching the stored row", async $ => {
	const first = await $.classic.MessageDisplay(flush("m1", 0, "## Verdict\n[[Done]] the split [`x`]\n"));
	expect(first.displayContent).toBe("## § Verdict\n**✓ Done** the split [`x`]\n");
	const second = await $.classic.MessageDisplay(flush("m1", 1, "[[Failed: 2]] left", true));
	expect(second.displayContent).toBe(`**✗ Failed:${nbsp}2** left`);
});

test("two messages streaming at once keep their own state", async $ => {
	const a = await $.classic.MessageDisplay(flush("a", 0, "[[Done", false));
	const b = await $.classic.MessageDisplay(flush("b", 0, "[[Needs you]]\n", false));
	expect(a.displayContent).toBe("");
	expect(b.displayContent).toBe(`**? Needs${nbsp}you**\n`);
	expect((await $.classic.MessageDisplay(flush("a", 1, "]] end", true))).displayContent).toBe("**✓ Done** end");
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
	expect((await $.classic.MessageDisplay(flush("m1", 0, "[[Done]]", true))).displayContent).toBe("**✓ Done**");
});

test("display off drops the drawing and the rules", { options: { display: false } }, async ($, on) => {
	on("prompt.compose", () => ({ sections: [] }));
	const composed = await $.prompt.compose(compose(["terminal"]));
	expect(composed.sections.map(s => s.id)).not.toContain("emphasis:reply_style");
	expect((await $.classic.MessageDisplay(flush("m1", 0, "[[Done]]", true))).displayContent).toBeUndefined();
});
