// Fails when manifest.json and package.json disagree on the version, and,
// when a tag is given (e.g. `node check-versions.mjs v1.2.1`), when the tag
// doesn't match either.
import { readFileSync } from "node:fs";

const read = (file) => JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"));

const manifestVersion = read("manifest.json").version;
const packageVersion = read("package.json").version;
const errors = [];

if (manifestVersion !== packageVersion) {
  errors.push(`manifest.json is ${manifestVersion} but package.json is ${packageVersion}.`);
}

const tag = process.argv[2];
if (tag !== undefined && tag.replace(/^v/, "") !== manifestVersion) {
  errors.push(`Tag ${tag} doesn't match manifest.json version ${manifestVersion}.`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`::error::${error}`);
  process.exit(1);
}

console.log(`Versions match: ${manifestVersion}${tag !== undefined ? ` (tag ${tag})` : ""}`);
