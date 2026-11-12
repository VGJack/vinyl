# Set up Vinyl's automatic GitHub updates

**First update from v0.5:** install v0.6 manually from the published GitHub release once. v0.5 has no configured update feed.

1. Create a **public** GitHub repository (for example, `yourname/Vinyl`).
2. Upload the **contents** of `Vinyl-browser`, not the enclosing folder, so `package.json` is at the repository root.
3. Push the source to `main`.
4. Create and push a version tag that exactly matches `package.json`:

   ```bash
   git tag v0.6.0
   git push origin v0.6.0
   ```

5. Watch **Actions → Vinyl Windows**. A successful tagged run uploads `Vinyl-Setup-0.6.0.exe`, `latest.yml`, and related update assets to a draft release.
6. Open **Releases**, inspect the draft release, and click **Publish release**. The update client ignores drafts.
7. Download and run `Vinyl-Setup-0.6.0.exe` once on top of your existing Vinyl installation, preserving the same Windows user and install location.
8. Next time, update `package.json` to `0.7.0`, push the code, push `v0.7.0`, publish the draft release, and open Vinyl. Vinyl will check automatically and offer **Restart to update**.

Important: use the same application ID, installation scope, and preferably the same code signing certificate. If the repository is private, regular GitHub Releases updates are not directly accessible to the installed browser without additional authentication. A public releases repository is recommended. Automatic updates are configured but were not tested with a built Windows executable here.
