import { entriesByKey, parseEnv } from "./env-parser.js";

const PLACEHOLDER_VALUES = new Set([
  "changeme",
  "change-me",
  "replace-me",
  "replace_me",
  "todo",
  "example",
  "secret",
  "password"
]);

const SECRET_KEY_PATTERN = /(secret|token|password|passwd|private|credential|api[_-]?key|access[_-]?key)/i;

export function auditEnvFiles(actualContent, exampleContent, options = {}) {
  const actualSource = options.actualSource ?? ".env";
  const exampleSource = options.exampleSource ?? ".env.example";
  const allowExtra = Boolean(options.allowExtra);
  const requireNonEmpty = Boolean(options.requireNonEmpty);

  const actual = parseEnv(actualContent, actualSource);
  const example = parseEnv(exampleContent, exampleSource);
  const actualIndex = entriesByKey(actual.entries);
  const exampleIndex = entriesByKey(example.entries);
  const problems = [];

  for (const error of [...actual.errors, ...example.errors]) {
    problems.push({
      severity: "error",
      code: error.code,
      source: error.source,
      line: error.line,
      message: error.message
    });
  }

  for (const duplicate of [...actualIndex.duplicates, ...exampleIndex.duplicates]) {
    problems.push({
      severity: "error",
      code: "env.duplicate_key",
      key: duplicate.key,
      source: duplicate.source,
      line: duplicate.line,
      message: `${duplicate.key} is defined more than once; first definition is on line ${duplicate.firstLine}.`
    });
  }

  for (const [key, exampleEntry] of exampleIndex.map) {
    const actualEntry = actualIndex.map.get(key);
    if (!actualEntry) {
      problems.push({
        severity: "error",
        code: "env.missing_key",
        key,
        source: exampleSource,
        line: exampleEntry.line,
        message: `${key} is documented in ${exampleSource} but missing from ${actualSource}.`
      });
      continue;
    }

    if (requireNonEmpty && actualEntry.value.trim() === "") {
      problems.push({
        severity: "error",
        code: "env.blank_value",
        key,
        source: actualEntry.source,
        line: actualEntry.line,
        message: `${key} is required but has a blank value.`
      });
    }

    if (isPlaceholder(actualEntry.value)) {
      problems.push({
        severity: "warning",
        code: "env.placeholder_value",
        key,
        source: actualEntry.source,
        line: actualEntry.line,
        message: `${key} still looks like a placeholder value.`
      });
    }
  }

  if (!allowExtra) {
    for (const [key, actualEntry] of actualIndex.map) {
      if (!exampleIndex.map.has(key)) {
        problems.push({
          severity: "error",
          code: "env.extra_key",
          key,
          source: actualEntry.source,
          line: actualEntry.line,
          message: `${key} exists in ${actualSource} but is not documented in ${exampleSource}.`
        });
      }
    }
  }

  for (const entry of exampleIndex.map.values()) {
    if (looksSensitive(entry.key, entry.value)) {
      problems.push({
        severity: "warning",
        code: "example.possible_secret",
        key: entry.key,
        source: entry.source,
        line: entry.line,
        message: `${entry.key} in ${exampleSource} has a value that may be sensitive.`
      });
    }
  }

  return {
    ok: !problems.some((problem) => problem.severity === "error"),
    problems,
    stats: {
      actualKeys: actualIndex.map.size,
      exampleKeys: exampleIndex.map.size,
      errors: problems.filter((problem) => problem.severity === "error").length,
      warnings: problems.filter((problem) => problem.severity === "warning").length
    }
  };
}

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return PLACEHOLDER_VALUES.has(normalized) || normalized.startsWith("replace-me") || /^<.+>$/.test(normalized);
}

function looksSensitive(key, value) {
  const trimmed = value.trim();

  if (trimmed === "") {
    return false;
  }

  if (!SECRET_KEY_PATTERN.test(key)) {
    return false;
  }

  return !isPlaceholder(trimmed) && trimmed.length > 8;
}
