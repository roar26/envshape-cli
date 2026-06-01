# EnvShape Rules

EnvShape currently applies a small set of rules that are easy to understand in
code review.

## Errors

- malformed dotenv line
- duplicate variable name
- key documented in `.env.example` but missing from `.env`
- key present in `.env` but missing from `.env.example`, unless `--allow-extra`
  is used
- blank required value when `--require-non-empty` is used
- warning found while `--strict` is used

## Warnings

- local value still looks like a placeholder
- secret-like key in `.env.example` has a non-placeholder value

Warnings do not fail the command by themselves. They are intended to help
maintainers spot risky configuration before a pull request is merged.
