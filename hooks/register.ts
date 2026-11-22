import type { Register } from "claude-code";

import { Emphasizer } from "../src/emphasis";
import { replyGuidance } from "../src/guidance";

export const register: Register = (on, options) => {
	const streams = new Map<string, Emphasizer>();
	let lastTurn = "";

	// A pill or a fence can be split across flushes, so one message keeps one state until its final flush.
	on("classic.MessageDisplay", (_$, e) => {
		if (options.display === false) return {};

		// An interrupted reply never gets its final flush, so a new turn drops every state the old one left.
		if (e.turn_id !== lastTurn) {
			streams.clear();
			lastTurn = e.turn_id;
		}

		let stream = streams.get(e.message_id);
		if (stream === undefined) {
			stream = new Emphasizer();
			streams.set(e.message_id, stream);
		}
		const displayContent = stream.push(e.delta, e.final);
		if (e.final) streams.delete(e.message_id);

		return { displayContent };
	});

	// The rules travel with the renderer: a session that is not drawing pills is not told to write them.
	on("prompt.compose", async ($, e, next) => {
		const composed = await next(e);
		const sections = composed.sections.filter((section) => section.id !== "emphasis:reply_style");
		const isDrawing = options.guidance !== false && (options.display !== false) && e.surfaces.includes("terminal");
		return {
			sections: isDrawing ? [...sections, { id: "emphasis:reply_style", text: replyGuidance(), scope: "session" }] : sections,
		};
	});
};
