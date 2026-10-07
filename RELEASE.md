# Release process

This repository is consumed directly from GitHub by downstream projects such as
glam-cp. Releases are therefore the pinning contract.

## Versioning

- Semantic versioning: `MAJOR.MINOR.PATCH`.
- Git tags: `vMAJOR.MINOR.PATCH`.
- `package.json` `version`, `VERSION`, and `CHANGELOG.md` must agree.

## Release checklist

1. Update tokens, manifests, assets, docs, or tooling.
2. Choose the next semver version.
3. Update:
   - `package.json`
   - `package-lock.json`
   - `VERSION`
   - `CHANGELOG.md`
4. Run:

   ```bash
   npm ci
   npm run ci
   ```

5. Commit the release prep.
6. Tag the release:

   ```bash
   git tag -a v<VERSION> -m "v<VERSION>"
   git push origin main
   git push origin v<VERSION>
   ```

The GitHub Actions release workflow creates the GitHub Release from the pushed
tag.

## glam-cp consumption

glam-cp should pin the tag in `docs/brand/design-system-source.json`:

- `pinKind: release`
- `version: <VERSION>`
- `releaseTag: v<VERSION>`
- `rawUrl: https://raw.githubusercontent.com/andrewkriley/design-system/v<VERSION>/design-system/tokens/therileys-team.json`

Do not consume `main` from glam-cp runtime or CI.
