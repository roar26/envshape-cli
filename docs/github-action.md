# GitHub Action

This repository can be used directly as a GitHub Action. It runs the EnvShape
CLI and emits GitHub workflow annotations for each error or warning.

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
          env-file: .env.local
          example-file: .env.example
          require-non-empty: "true"
          strict: "true"
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `env-file` | `.env` | Private env file to check. |
| `example-file` | `.env.example` | Public example contract. |
| `allow-extra` | `false` | Allow local variables that are not documented in the example file. |
| `require-non-empty` | `false` | Fail when documented values are blank in the env file. |
| `strict` | `false` | Treat warnings as failures. |

Pinning to a version tag keeps CI behavior stable across future releases.
