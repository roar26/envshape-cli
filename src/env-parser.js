const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parseEnv(content, source = "<memory>") {
  const entries = [];
  const errors = [];
  const lines = content.replace(/\r\n?/g, "\n").split("\n");

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      return;
    }

    const withoutExport = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trimStart()
      : trimmed;

    const equalsIndex = withoutExport.indexOf("=");
    if (equalsIndex === -1) {
      errors.push({
        source,
        line: lineNumber,
        code: "parse.missing_equals",
        message: "Expected KEY=value syntax."
      });
      return;
    }

    const key = withoutExport.slice(0, equalsIndex).trim();
    const rawValue = withoutExport.slice(equalsIndex + 1);

    if (!KEY_PATTERN.test(key)) {
      errors.push({
        source,
        line: lineNumber,
        code: "parse.invalid_key",
        message: `Invalid environment variable name "${key}".`
      });
      return;
    }

    const parsed = parseValue(rawValue);
    if (parsed.error) {
      errors.push({
        source,
        line: lineNumber,
        code: parsed.error.code,
        message: parsed.error.message
      });
    }

    entries.push({
      key,
      value: parsed.value,
      rawValue,
      line: lineNumber,
      source
    });
  });

  return { entries, errors };
}

export function entriesByKey(entries) {
  const map = new Map();
  const duplicates = [];

  for (const entry of entries) {
    if (map.has(entry.key)) {
      duplicates.push({
        key: entry.key,
        firstLine: map.get(entry.key).line,
        line: entry.line,
        source: entry.source
      });
      continue;
    }
    map.set(entry.key, entry);
  }

  return { map, duplicates };
}

function parseValue(rawValue) {
  const value = rawValue.trim();

  if (value === "") {
    return { value: "" };
  }

  if (value.startsWith("\"")) {
    return parseDoubleQuoted(value);
  }

  if (value.startsWith("'")) {
    return parseSingleQuoted(value);
  }

  return {
    value: stripInlineComment(value).trim()
  };
}

function parseDoubleQuoted(value) {
  const closingIndex = findClosingQuote(value, "\"");

  if (closingIndex === -1) {
    return {
      value: value.slice(1),
      error: {
        code: "parse.unclosed_quote",
        message: "Unclosed double-quoted value."
      }
    };
  }

  const body = value.slice(1, closingIndex);
  return {
    value: body.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\"/g, "\"")
  };
}

function parseSingleQuoted(value) {
  const closingIndex = findClosingQuote(value, "'");

  if (closingIndex === -1) {
    return {
      value: value.slice(1),
      error: {
        code: "parse.unclosed_quote",
        message: "Unclosed single-quoted value."
      }
    };
  }

  return {
    value: value.slice(1, closingIndex)
  };
}

function findClosingQuote(value, quote) {
  for (let index = 1; index < value.length; index += 1) {
    if (value[index] === quote && value[index - 1] !== "\\") {
      return index;
    }
  }

  return -1;
}

function stripInlineComment(value) {
  const marker = value.search(/\s#/);
  return marker === -1 ? value : value.slice(0, marker);
}
