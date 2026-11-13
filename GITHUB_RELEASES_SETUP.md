# Publish Vinyl updates to VGJack/vinyl

The Git remote and `update-config.json` both point to `VGJack/vinyl`. The app version for this change is **0.7.1**.

1. Commit and push the reviewed contents of the `vinyl` directory to `main`. `package.json` and `.github/workflows/windows-build.yml` must be at the GitHub repository root. Include `package-lock.json`.
2. Tag that commit with the complete package version:

   ```sh
   git tag v0.7.1
   git push origin v0.7.1
   ```

3. Wait for **Actions → Vinyl Windows** to succeed. The tag must be `v0.7.1`, not `v0.7`; the workflow deliberately rejects version mismatches.
4. Inspect the resulting draft release. It must contain `Vinyl-Setup-0.7.1.exe`, the installer `.blockmap`, and `latest.yml`. Publish the draft only after reviewing the build.
5. Install this release manually once over any old local Vinyl build that has no update channel. Keep the same Windows user, installation scope/location, product name, and app ID.
6. For later releases, bump both package files, build/tag the matching version, and publish all generated release assets. Installed 0.7 copies can discover those releases automatically.

The existing published `v0.6` release had no binary/update assets when inspected. GitHub's automatically generated source archives do not supply `latest.yml` and cannot be installed by electron-updater.

The local build produces the same three files in `dist/` without uploading them. Never mix the metadata from one installer with a different executable: `latest.yml` contains that executable's SHA-512 hash and size. Do not attach a 0.7.1 installer to the old v0.6 release; the release tag must match the metadata version.

No source push, Git tag, or release publication is performed by the local build command.
