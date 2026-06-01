# Contributing

Thanks for considering a contribution to EnvShape CLI.

## Local Setup

```bash
npm install
npm test
```

Run the example contract check:

```bash
npm run check
```

## Pull Request Guidelines

- Keep changes focused on one behavior or documentation improvement.
- Add tests for parser, audit, or generator changes.
- Avoid adding runtime dependencies unless the benefit is clear and documented.
- Do not commit real `.env` files or credentials.

## Development Notes

EnvShape is designed to stay small and auditable. Parser behavior should be
predictable rather than clever, and security-related checks should prefer clear
warnings over broad assumptions.
