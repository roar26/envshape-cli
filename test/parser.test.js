import assert from "node:assert/strict";
import { test } from "node:test";
import { entriesByKey, parseEnv } from "../src/env-parser.js";

test("parses common dotenv syntax", () => {
  const parsed = parseEnv(`
# comment
PORT=3000
export NODE_ENV=development
QUOTED="hello world"
SINGLE='literal value'
INLINE=value # trailing comment
`);

  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.entries.map((entry) => [entry.key, entry.value]), [
    ["PORT", "3000"],
    ["NODE_ENV", "development"],
    ["QUOTED", "hello world"],
    ["SINGLE", "literal value"],
    ["INLINE", "value"]
  ]);
});

test("reports malformed lines", () => {
  const parsed = parseEnv("NO_EQUALS\n1BAD=value\n");

  assert.equal(parsed.errors.length, 2);
  assert.equal(parsed.errors[0].code, "parse.missing_equals");
  assert.equal(parsed.errors[1].code, "parse.invalid_key");
});

test("detects duplicate keys", () => {
  const parsed = parseEnv("PORT=3000\nPORT=4000\n");
  const index = entriesByKey(parsed.entries);

  assert.equal(index.map.get("PORT").value, "3000");
  assert.deepEqual(index.duplicates, [
    {
      key: "PORT",
      firstLine: 1,
      line: 2,
      source: "<memory>"
    }
  ]);
});
