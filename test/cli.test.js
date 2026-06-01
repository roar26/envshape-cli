import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../src/cli.js", import.meta.url));
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("prints the package version", () => {
  const result = runCli(["--version"]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), packageJson.version);
});

test("strict mode fails when warnings are present", () => {
  const directory = makeFixture("strict-warning");
  const envPath = join(directory, ".env");
  const examplePath = join(directory, ".env.example");

  writeFileSync(envPath, "SESSION_SECRET=replace-me\n", "utf8");
  writeFileSync(examplePath, "SESSION_SECRET=\n", "utf8");

  const result = runCli(["check", "--env", envPath, "--example", examplePath, "--strict"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /strict mode treats warnings as failures/);
});

test("github format writes workflow annotations", () => {
  const directory = makeFixture("github-format");
  const envPath = join(directory, ".env");
  const examplePath = join(directory, ".env.example");

  writeFileSync(envPath, "PORT=3000\n", "utf8");
  writeFileSync(examplePath, "PORT=3000\nDATABASE_URL=\n", "utf8");

  const result = runCli(["check", "--env", envPath, "--example", examplePath, "--format", "github"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /::error file=.*\.env\.example,line=2,title=env\.missing_key::DATABASE_URL is documented/);
});

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    windowsHide: true
  });
}

function makeFixture(name) {
  const directory = join(tmpdir(), `envshape-${name}-${process.pid}-${Date.now()}`);
  mkdirSync(directory, { recursive: true });
  return directory;
}
