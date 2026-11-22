// Fails when CHANGELOG.md disagrees with plugin.json, so a release never ships notes with a
// missing section or a link to a tag the file does not cover.
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(".claude-plugin/plugin.json", "utf8"));
const text = readFileSync("CHANGELOG.md", "utf8");

const bodies = new Map(
	text
		.split(/^## \[/m)
		.slice(1)
		.map((part) => [part.slice(0, part.indexOf("]")), part.slice(part.indexOf("\n") + 1)]),
);
const links = new Map([...text.matchAll(/^\[([^\]]+)\]:\s*(\S+)/gm)].map((m) => [m[1], m[2]]));
const releases = [...bodies.keys()].filter((k) => k !== "Unreleased");
const errors = [];

if (!bodies.has(version)) errors.push(`no "## [${version}]" section for the version in plugin.json`);
if (!(bodies.get(version) ?? "").replace(/^\[.*\]:.*$/gm, "").trim()) errors.push(`the [${version}] section is empty`);
for (const r of releases) if (!links.has(r)) errors.push(`section [${r}] has no link definition`);
for (const [label, url] of links) {
	if (!bodies.has(label)) errors.push(`link [${label}] has no section`);
	for (const tag of url.match(/v\d+\.\d+\.\d+/g) ?? []) {
		if (!bodies.has(tag.slice(1))) errors.push(`link [${label}] points at ${tag}, which has no section`);
	}
}

if (errors.length) {
	console.error(errors.join("\n"));
	process.exit(1);
}
// --print feeds the release job's notes, so the release text is the file, not a second copy.
if (process.argv.includes("--print")) process.stdout.write((bodies.get(version) ?? "").replace(/^\[.*\]:.*$/gm, "").trim() + "\n");
else console.log(`CHANGELOG.md covers ${version}, with ${releases.length} releases`);
