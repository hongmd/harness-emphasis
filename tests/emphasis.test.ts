import { expect, test } from "claude-code/testing";

import { decorate, Emphasizer, pill, splitLabel, toneOf } from "../src/emphasis";

test("a known word keeps its tone whatever its case or spacing", () => {
	expect(toneOf("Failed")).toBe("error");
	expect(toneOf("failed")).toBe("error");
	expect(toneOf("NEEDS   YOU")).toBe("warning");
	expect(toneOf("Costs money")).toBe("danger");
	expect(toneOf("Implement")).toBe("mode");
	expect(toneOf("Shared")).toBe("owner");
	expect(toneOf("Inferred")).toBe("neutral");
	expect(toneOf("Sandwich")).toBe("neutral");
});

test("a synonym reads as its canonical word", () => {
	expect(splitLabel("Completed").word).toBe("Done");
	expect(splitLabel("error").word).toBe("Failed");
	expect(splitLabel("Passed 12/12").word).toBe("Passed 12/12");
});

const nbsp = "\u00a0";

test("a pill keeps its detail and holds its words together", () => {
	expect(pill("Needs you")).toBe("**? Needs you**");
	expect(pill("Failed: 3 tests")).toBe(`**✗ Failed:${nbsp}3${nbsp}tests**`);
	expect(pill("Complete")).toBe("**✓ Done**");
	expect(pill("Sandwich")).toBe("**● Sandwich**");
	expect(pill("   ")).toBe("[[   ]]");
});

test("an unknown word still reads as a pill, with its tone's glyph", () => {
	expect(pill("Rejected")).toBe("**⊘ Rejected**");
	expect(pill("Deprecated")).toBe("**● Deprecated**");
});

test("pills in prose are drawn, code and escaped markers are left as typed", () => {
	expect(decorate("It [[Done]] now")).toBe("It **✓ Done** now");
	expect(decorate("[[Done 6]] [[Failed 1]]")).toBe(`**✓ Done${nbsp}6** **✗ Failed${nbsp}1**`);
	expect(decorate("Run `echo [[Done]]` first")).toBe("Run `echo [[Done]]` first");
	expect(decorate("A \\[[Done]] stays")).toBe("A \\[[Done]] stays");
	expect(decorate('A "[[Done]]" quoted')).toBe('A "**✓ Done**" quoted');
});

test("fenced code keeps its pills, and a fence may open in one call and close in another", () => {
	const ctx: { fence?: string } = {};
	expect(decorate("```\n[[Done]]\n```", ctx)).toBe("```\n[[Done]]\n```");
	expect(decorate("```", ctx)).toBe("```");
	expect(decorate("[[Done]]", ctx)).toBe("[[Done]]");
	expect(decorate("```", ctx)).toBe("```");
	expect(decorate("[[Done]]", ctx)).toBe("**✓ Done**");
});

test("a known heading and a known lead label gain a glyph; other text is untouched", () => {
	expect(decorate("## Verdict")).toBe("## § Verdict");
	expect(decorate("## Anything else")).toBe("## Anything else");
	expect(decorate("**Cause:** the lock")).toBe("**∆ Cause:** the lock");
	expect(decorate("- **Next:** ship it")).toBe("- **→ Next:** ship it");
	expect(decorate("Already ✓ Done")).toBe("Already ✓ Done");
	expect(decorate("The **Cause:** inline")).toBe("The **Cause:** inline");
	expect(decorate("Then **Check:** the log")).toBe("Then **✓ Check:** the log");
});

test("one message's flushes join a pill split across them", () => {
	const stream = new Emphasizer();
	expect(stream.push("Status: [[Done", false)).toBe("");
	expect(stream.push("]] today\nnext line\n", false)).toBe("Status: **✓ Done** today\nnext line\n");
	expect(stream.push("last [[Failed: 1]]", true)).toBe(`last **✗ Failed:${nbsp}1**`);
});
