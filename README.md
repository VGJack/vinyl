# Vinyl v0.6

Vinyl is an experimental Electron/Chromium-powered desktop browser with its own interface, a native left bookmark shelf, a retractable toolbar, and update support through GitHub Releases. It is not Google Chrome or a full Chromium source fork.

## Updating the installed application

**The first upgrade from Vinyl v0.5 to v0.6 must be installed manually once.** v0.5 cannot discover an update because it was built without a release feed. The v0.6 installer keeps the same Windows app ID (`app.vinyl.browser`) and user data location; install it using the same Windows account, installation scope, and location as v0.5. Do not uninstall the older app first.

Once Vinyl has been installed **from a GitHub Releases build with an update channel**, it checks for newer published releases at startup and every six hours. It downloads eligible updates, then shows **Restart to update** in Settings → About Vinyl. Selecting that button replaces the installed application files and reopens Vinyl. Your desktop/Start shortcuts continue pointing to Vinyl.

Vinyl's saved bookmarks, settings, Chrome profile link, and browser session data live separately from the installed application, normally under `%APPDATA%\Vinyl`. They are not intentionally removed by app upgrades. Back up that folder before the first updater-enabled upgrade because Windows installation and update handling have not been verified end-to-end in this environment.

Auto-update downloads may temporarily consume disk space until applied. Old standalone installers and `dist/` build outputs can be deleted once no longer needed. Automatic updates do not create an additional Vinyl installation for each version.

## Publish updates using GitHub Actions

The update channel requires a **public GitHub repository** where Vinyl installers and update metadata (`latest.yml`) are published as release assets. Private GitHub repositories are not a suitable public update feed without special client-side credentials.

1. Put the **contents of `Vinyl-browser`** at the root of your GitHub repository, so that `package.json` and `.github/workflows/windows-build.yml` are at the repository root.
2. Commit the project to `main`. A push to `main` produces a test installer under Actions, but **does not publish an update**.
3. Verify that `package.json` has a new version, starting with `0.6.0`.
4. Tag the commit with `v0.6.0` and push that tag:

   ```bash
   git tag v0.6.0
   git push origin v0.6.0
   ```

5. Open GitHub → **Actions → Vinyl Windows**. The tagged run checks that the tag and package version match, builds a Windows NSIS installer, and uploads the installer and `latest.yml` as assets of a **draft GitHub Release**.
6. Open GitHub → **Releases** and **Publish release** after inspecting the generated artifacts. Draft releases are invisible to Vinyl's updater. The published release must be public.
7. Download `Vinyl-Setup-0.6.0.exe` from the published release and run it **once** over your existing installation. Afterwards, future published versions can be installed using Vinyl's update prompt.

For every later release, change the version in `package.json` (for example `0.7.0`), commit and push your changes, tag the matching commit `v0.7.0`, and publish the draft release once its Actions build succeeds. Installed Vinyl checks for it automatically.

**Do not rename the application ID or the product name** between releases; keep using the Windows NSIS installer and the same installation scope. Ideally, sign all releases with the same Windows code-signing certificate. Unsigned applications can trigger Windows SmartScreen warnings. Publishing a new version does not automatically migrate Chrome profile cookies or add Chrome Sync.

## Local Windows installation and builds

1. Extract the Vinyl project on Windows.
2. Install Node.js 22+ from https://nodejs.org/ if necessary; this is required for building, but **not** for using the installed app.
3. If you're creating a local installer that should receive GitHub updates, open `update-config.json` and set `githubRepository` to your public `owner/repository` (for example `yourname/vinyl`). In GitHub Actions this is populated automatically from the repository, so no manual edit is required for CI builds.
4. Double-click `INSTALL_VINYL.bat` to install dependencies, check sources, build the installer, and launch it. Alternatively, run `BUILD_WINDOWS.bat`, then open the installer from `dist/`.

The ZIP is **source code**, not a compiled `.exe`. The Windows installer has not been produced or verified in this environment. If you install a locally built version with no update repository configured, that installation cannot receive future in-app updates; use the signed or unsigned installer from the GitHub Releases build instead.

## Update architecture

- Build: `electron-builder` Windows NSIS target with app ID `app.vinyl.browser`
- Publication: GitHub Actions, `npm run publish:win`, GitHub Releases draft assets
- Metadata: electron-builder generates `latest.yml` and the installed app's `app-update.yml`
- Client: `electron-updater` with background checks and downloads, explicit Restart to update
- Application data: remains in Electron's user data folder, separate from installed executables
- Channel configuration: on CI, `GITHUB_REPOSITORY`; locally, `update-config.json` / `VINYL_GITHUB_REPOSITORY`
- Safety: no arbitrary update URLs or untrusted IPC destinations; release tags must match `package.json`

The installer is not currently code-signed. Before using Vinyl as a serious daily browser or distributing to others, test the upgrade and rollback process on Windows and add Windows code signing.

## Branding and browser UI

The launch animation now rolls translucent material sheets into the **same V logo** as the upper-left browser icon, rather than the Google Chrome logo. The upper-left text label has been removed. The left shelf remains a minimal bookmark app-icon grid. The Extensions tab is removed and extension loading is disabled. Extension metadata in older user profiles is retained only to avoid destructive migrations. The address toolbar supports **Always**, **Compact**, and **Auto-retract** in Settings → Browser, and Ctrl+L reveals it.

## New start page and controls

- The **bookmark shelf button stays at the upper left**, beside the Vinyl mark. The drawer itself always opens on the left.
- The top address/navigation row has **Auto-retract**, **Always visible**, and **Compact** modes. The pin control and Settings control remain accessible in the tab strip even while the address row is hidden. Hover near the top or press `Ctrl+L` to reveal the address bar. Auto-retract is the default for new installs; an older saved preference is respected until changed.
- The start page includes **Good morning / afternoon / evening, Jack**, a local clock, the search box, shortcuts, the **four most recently visited pages**, headlines, and a weather tile.
- Recent pages are recorded in Vinyl's own data store. Thumbnail screenshots are kept **in memory for this session only**; after restart or when a page cannot be captured, recent cards show website icons instead. Preview images may contain onscreen page content, so disable the **Recent tabs** setting if you do not want thumbnails.
- The news tile uses live **Google News RSS** headlines. Weather uses **Open-Meteo** live weather data in °F. Both require internet access, refresh periodically, and show an unavailable state if they cannot load. Weather does **not** track your location; click **City** and enter a location once to save it to Vinyl.
- News, weather, recent tabs, and shortcuts can each be hidden under **Settings → Browser**.
- Chrome-imported empty bookmark titles show **no text label**. Site favicons are requested from the site first, then Google and DuckDuckGo icon endpoints if needed. Those remote icon services can see the requested domain name.
- The landing page animates a soft translucent sheet unrolling before the clock, shortcuts, and cards settle into position. Reduced Motion disables the animation.

## Import Chrome bookmarks

Open **Settings → Chrome data**:

- Choose your Chrome profile and select **Import from Chrome**. Vinyl creates a new editable folder of Chrome bookmarks and nested folders. It reads the local Chrome profile without changing it. Imported bookmark files do not include your Chrome passwords, cookies, settings or installed extensions.
- Or select **Import bookmarks HTML → Choose file** to import a Chrome bookmark export (Chrome's bookmark manager → Organize → Export bookmarks). This works even if Chrome isn't installed on the same machine. Imported HTML content is treated as data and only HTTP(S) links are accepted.
- Optionally **Link profile** to view read-only bookmarks that refresh when Chrome's local bookmark file changes. Vinyl no longer lists, loads, or manages Chrome extensions.

Re-importing creates an additional folder rather than overwriting or deleting existing Vinyl bookmarks. Existing Vinyl v0.3 bookmarks and preferences remain where they were.

## Google / YouTube / Gmail website sign-in

Open **Settings → Accounts** and select **YouTube**, **Gmail**, or **Account**. That opens the service in an ordinary Vinyl browser tab. Vinyl's tabs share the **same default persistent browser session** and its site cookies; if Google permits you to sign in inside this Electron-powered browser, that website login should be usable in other Vinyl tabs and remain stored across restarts.

**Important limitation:** Google may block account sign-ins in embedded Electron browser views (error `disallowed_useragent` or a message stating the browser is not secure). There is no supported way for Vinyl to silently extract Chrome's Google cookies or turn a separate Google OAuth identity into logged-in YouTube/Gmail website sessions. This version does **not** guarantee Google website login, cannot reuse your existing Chrome Google session, and cannot provide Chrome Sync. Do not try to bypass Google's security checks.

The separate **Vinyl account connection** below the website buttons uses Google's approved desktop OAuth + PKCE process through your system browser. It requires a Google Cloud OAuth Desktop client ID and requests basic profile details. This identifies you to Vinyl, **not** to Google websites inside Vinyl. To use it, configure your own Desktop OAuth client at https://console.cloud.google.com/apis/credentials, paste the ID in Settings → Accounts, and select Connect.

## Security and scope

Vinyl is a prototype, not a production-hardened browser. Avoid banking, sensitive passwords, or other high-stakes accounts in it. This version intentionally does not load browser extensions. Chromium's private Chrome Sync integrations and Chrome settings parity are not available. The updater requires a published GitHub Releases channel. Windows installation, real in-app upgrades, and live Google website authentication have not been verified in this environment.

## Source commands

- `npm install` — fetch dependencies
- `npm run check` — syntax checks and unit tests
- `npm start` — development launch
- `npm run build:win` — build Windows NSIS installer without publishing
- `npm run publish:win` — build and publish a draft GitHub release installer and metadata (requires a GitHub repository and release token)
- `python tests/preview.py` — test the UI layout in headless Chromium (requires Playwright and its browser)

