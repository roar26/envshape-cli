import assert from "node:assert/strict";
import { test } from "node:test";
import { auditEnvFiles } from "../src/audit.js";

test("passes when env and example contain the same keys", () => {
  const result = auditEnvFiles(
    "PORT=3000\nDATABASE_URL=postgres://localhost/app\n",
    "PORT=3000\nDATABASE_URL=\n",
    { requireNonEmpty: true }
  );

  assert.equal(result.ok, true);
  assert.equal(result.stats.errors, 0);
});

test("fails for missing and extra keys", () => {
  const result = auditEnvFiles("PORT=3000\nEXTRA=true\n", "PORT=3000\nDATABASE_URL=\n");

  assert.equal(result.ok, false);
  assert.deepEqual(result.problems.map((problem) => problem.code), [
    "env.missing_key",
    "env.extra_key"
  ]);
});

test("warns about possible secrets in example files", () => {
  const result = auditEnvFiles("API_TOKEN=local-token\n", "API_TOKEN=abc123456789\n");

  assert.equal(result.ok, true);
  assert.equal(result.problems[0].code, "example.possible_secret");
});
