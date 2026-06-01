# EnvShape CLI

[![CI](https://github.com/roar26/envshape-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/roar26/envshape-cli/actions/workflows/ci.yml)

EnvShape is a small zero-dependency command line tool for keeping environment
variable files honest. It compares a private `.env` file with a public
`.env.example` contract, reports drift, and can generate a safe example file
without copying secrets.

The project is intentionally small: it is easy to audit, works in CI, and does
not need a build step.

## Why this exists

Open source projects often keep a `.env.example` file in the repository while
real secrets live in `.env`. Over time, those two files drift:

- a required key is added to `.env` but not documented
- an example key is removed but the app still needs it
- local files contain empty placeholder values
- `.env.example` accidentally receives a real token or password

EnvShape catches those cases before they surprise a new contributor or leak in
a pull request.

## Install

Run without installing:

```bash
npx envshape-cli@latest check --env .env --example .env.example
```

Install in a project:

```bash
npm install --save-dev envshape-cli
```

Then run:

```bash
npx envshape check --env .env --example .env.example
```

For local development from this repository:

```bash
npm install
npm link
```

Or run it directly from the repository:

```bash
node src/cli.js check --env .env --example .env.example
```

## Usage

Check a private `.env` file against a public example contract:

```bash
envshape check --env .env --example .env.example
```

Fail when required values are present but blank:

```bash
envshape check --env .env --example .env.example --require-non-empty
```

Allow local-only variables that are not listed in the example file:

```bash
envshape check --env .env --example .env.example --allow-extra
```

Return machine-readable output:

```bash
envshape check --env .env --example .env.example --json
```

Use GitHub Actions annotations:

```bash
envshape check --env .env --example .env.example --format github
```

Treat warnings as failures:

```bash
envshape check --env .env --example .env.example --strict
```

Generate a safe `.env.example` file from an existing `.env` file:

```bash
envshape generate --env .env --out .env.example
```

Overwrite an existing output file:

```bash
envshape generate --env .env --out .env.example --force
```

List the keys in a file:

```bash
envshape list --env .env
```

## CI Example

Use EnvShape directly as a GitHub Action:

```yaml
name: envshape

on:
  pull_request:
  push:
    branches: [main]

jobs:
  envshape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: roar26/envshape-cli@v0.1.1
        with:
          env-file: examples/.env.local
          example-file: examples/.env.example
          require-non-empty: "true"
          strict: "true"
```

Or run the CLI in an existing Node.js workflow:

```yaml
name: envshape

on:
  pull_request:
  push:
    branches: [main]

jobs:
  envshape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run ci
```

## Exit Codes

- `0`: no blocking problems were found
- `1`: EnvShape found an error or could not complete the requested command

Warnings are printed for potentially risky example values, but they do not fail
the command unless they accompany an error or `--strict` is used.

## Project Status

This is an early open source project. The first goal is a dependable CLI for
small and medium JavaScript projects. Planned improvements include typed rules,
schema export, and adapters for framework-specific environment conventions.
See [ROADMAP.md](ROADMAP.md) for planned work.

## Contributing

Issues and pull requests are welcome. Please keep changes focused and add tests
for parser or audit behavior.

```bash
npm test
```

## License

MIT
