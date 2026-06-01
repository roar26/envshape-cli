#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { auditEnvFiles } from "./audit.js";
import { parseEnv } from "./env-parser.js";
import { generateExample } from "./generate-example.js";

const args = process.argv.slice(2);
const command = args[0];

try {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "check") {
    runCheck(parseFlags(args.slice(1)));
  } else if (command === "generate") {
    runGenerate(parseFlags(args.slice(1)));
  } else if (command === "list") {
    runList(parseFlags(args.slice(1)));
  } else {
    fail(`Unknown command "${command}". Run envshape --help for usage.`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

function runCheck(flags) {
  const envPath = requireFlag(flags, "env");
  const examplePath = requireFlag(flags, "example");
  const actualContent = readTextFile(envPath);
  const exampleContent = readTextFile(examplePath);
  const result = auditEnvFiles(actualContent, exampleContent, {
    actualSource: envPath,
    exampleSource: examplePath,
    allowExtra: Boolean(flags["allow-extra"]),
    requireNonEmpty: Boolean(flags["require-non-empty"])
  });

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printAudit(result);
  }

  process.exit(result.ok ? 0 : 1);
}

function runGenerate(flags) {
  const envPath = requireFlag(flags, "env");
  const outPath = requireFlag(flags, "out");

  if (existsSync(outPath) && !flags.force) {
    fail(`${outPath} already exists. Pass --force to overwrite it.`);
  }

  const result = generateExample(readTextFile(envPath), {
    source: envPath,
    keepDefaults: Boolean(flags["keep-defaults"])
  });

  if (result.errors.length > 0 || result.duplicates.length > 0) {
    for (const error of result.errors) {
      console.error(formatProblem({ severity: "error", ...error }));
    }
    for (const duplicate of result.duplicates) {
      console.error(formatProblem({
        severity: "error",
        source: duplicate.source,
        line: duplicate.line,
        code: "env.duplicate_key",
        message: `${duplicate.key} is defined more than once.`
      }));
    }
    process.exit(1);
  }

  writeFileSync(outPath, result.content, "utf8");
  console.log(`Generated ${outPath}`);
}

function runList(flags) {
  const envPath = requireFlag(flags, "env");
  const parsed = parseEnv(readTextFile(envPath), envPath);

  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      console.error(formatProblem({ severity: "error", ...error }));
    }
    process.exit(1);
  }

  for (const entry of parsed.entries) {
    console.log(entry.key);
  }
}

function parseFlags(tokens) {
  const flags = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token.startsWith("--")) {
      fail(`Unexpected argument "${token}".`);
    }

    const name = token.slice(2);
    const next = tokens[index + 1];

    if (!next || next.startsWith("--")) {
      flags[name] = true;
    } else {
      flags[name] = next;
      index += 1;
    }
  }

  return flags;
}

function requireFlag(flags, name) {
  const value = flags[name];

  if (typeof value !== "string" || value.trim() === "") {
    fail(`Missing required --${name} value.`);
  }

  return value;
}

function readTextFile(path) {
  if (!existsSync(path)) {
    fail(`File not found: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function printAudit(result) {
  if (result.problems.length === 0) {
    console.log(`OK: ${result.stats.actualKeys} keys match the example contract.`);
    return;
  }

  for (const problem of result.problems) {
    const output = formatProblem(problem);
    if (problem.severity === "warning") {
      console.warn(output);
    } else {
      console.error(output);
    }
  }

  console.log("");
  console.log(`Checked ${result.stats.actualKeys} local keys against ${result.stats.exampleKeys} example keys.`);
  console.log(`Found ${result.stats.errors} errors and ${result.stats.warnings} warnings.`);
}

function formatProblem(problem) {
  const location = problem.source && problem.line ? `${problem.source}:${problem.line}` : problem.source;
  const code = problem.code ? ` ${problem.code}` : "";
  const prefix = `${problem.severity.toUpperCase()}${code}`;
  return location ? `${prefix} ${location} - ${problem.message}` : `${prefix} - ${problem.message}`;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`EnvShape CLI

Usage:
  envshape check --env .env --example .env.example [--allow-extra] [--require-non-empty] [--json]
  envshape generate --env .env --out .env.example [--force] [--keep-defaults]
  envshape list --env .env

Commands:
  check      Compare a private env file with a public example contract.
  generate   Create a safe .env.example file from an env file.
  list       Print parsed variable names.
`);
}
