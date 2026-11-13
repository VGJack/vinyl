# Push-to-update for Vinyl

Push your changes to `main`. That is the entire update workflow: no version bump, tag, release form, or manual upload is needed.

GitHub Actions runs the checks, assigns a build version, builds the Windows installer, and uploads the complete update. Installed Vinyl checks at startup and every five minutes and downloads newer builds automatically. Select **Restart to update** after the download finishes. **Check now** requests an immediate check.

The first push containing `.github/workflows/windows-build.yml` and the supporting scripts enables this pipeline. The repository root must contain `package.json` and `.github`; in the local workspace this is the `vinyl` folder. Older 0.7 installations can discover the first automatic build through their existing feed. An old 0.6 installation without an update feed needs one manual installation first.

## How delivery works

The workflow uses GitHub's binary download storage behind the scenes. It creates its own tag and release record; you never need to manage those. Source archives and Actions artifacts alone are not the download channel.

Each build uses the manifest's major/minor version and adds `GITHUB_RUN_NUMBER` to its base patch number. For example, base `0.7.3` with run 8 produces `0.7.11`. This changes only the CI checkout, not the source files in your branch. Each normal subsequent push gets a newer version without editing the manifest.

The installer, its `.blockmap`, and `latest.yml` are validated for version, size and SHA-512 before any upload. Uploads remain unpublished until all three files are present and verified. Failed tests, builds or uploads leave the previous update available. Interrupted uploads can be retried. A completed published build is never overwritten, and an older queued build is not promoted after a newer push arrives.

Only `main` publishes. The workflow uses GitHub Actions' built-in `GITHUB_TOKEN` with `contents: write`; no personal token belongs in Vinyl. If a build fails, inspect **Actions → Vinyl Windows**. Correct the problem and push again, or rerun the failed job. No release page steps are needed.

## Local checks

- `npm run check` includes automatic versioning, artifact integrity, publication ordering, interrupted-upload recovery, and updater error handling.
- `npm run test:updater-runtime` checks the actual Settings button and retry flow in an isolated Electron profile. Requires Playwright.
- `npm run test:updater-runtime -- --live` makes a read-only check against the public update feed without downloading or installing.
- `npm run build:win` produces a local installer without uploading it.
