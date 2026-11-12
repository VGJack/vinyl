# Vinyl v0.5

Vinyl is an experimental Electron/Chromium-powered desktop browser with its own interface, a native left bookmark shelf, and a retractable toolbar. It is not Google Chrome or a full Chromium source fork.

## Install as an actual Windows application

1. Extract the Vinyl ZIP to a folder on your Windows computer.
2. Install **Node.js 22 or newer** from https://nodejs.org/ if you do not already have it. This is needed only to build the current project; you do not need Node to launch an installed Vinyl app.
3. **Double-click `INSTALL_VINYL.bat`**. On first use, this downloads Electron and build dependencies, runs the tests, builds `dist/Vinyl-Setup-0.5.0.exe`, and launches the installer. This requires an internet connection and can take a while.
4. Complete the installer. Vinyl is now a normal desktop application, with a **Vinyl desktop shortcut and Start menu entry** using the translucent V icon. Double-click the app icon to launch it—no script, development tools, or terminal needed after installation.

If you prefer separate steps, double-click `BUILD_WINDOWS.bat` and then run `dist/Vinyl-Setup-0.5.0.exe`. Neither script is itself a browser; they generate the Windows installer. **The downloadable ZIP does not include a precompiled `.exe`.** This build was not compiled or tested on Windows in the development environment.

### Updates without losing your bookmarks

For subsequent releases, increase `version` in `package.json` (for example, `0.5.0` to `0.6.0`). The `BUILD_WINDOWS.bat` and `INSTALL_VINYL.bat` scripts now read the version automatically rather than referring to a fixed installer filename. Build the new `Vinyl-Setup-<version>.exe`, close Vinyl, and run the installer over the existing installation using the **same Windows user, installer scope, and installation location**. Do not uninstall the old application first.

If building on GitHub, commit the project to a repository (including `.github/workflows/windows-build.yml`, `assets`, and `package.json`), then download the Windows installer from the **Actions** run's `Vinyl-Windows-Installer` artifact. It is a build artifact, not an automatic update. The `.gitignore` excludes `dist/`, Electron dependencies, local browser profiles, and credentials. Commit `package-lock.json` when npm generates it for reproducible builds.


The installer uses the same app ID (`app.vinyl.browser`) and data directory on subsequent versions. Vinyl bookmarks, settings, imported Chrome folders, browser cookies, and the configured account identity are stored separately from installed application files, normally at `%APPDATA%\Vinyl` on Windows. To update, install a newer Vinyl Setup `.exe` over the current version. Do not delete that user data folder. Existing install shortcuts will still work.

Automatic online updates are prepared but **not active** until an HTTPS update feed is supplied in `update-config.json` and corresponding versioned artifacts are hosted. A GitHub Actions workflow at `.github/workflows/windows-build.yml` can build a Windows installer on a hosted Windows runner: place the project's contents at the root of a repository, run **Windows installer** in Actions, and download the generated installer artifact. Update installation still needs a reliable release channel and ideally code signing. Unsigned apps may show Windows SmartScreen warnings.

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

Vinyl is a prototype, not a production-hardened browser. Avoid banking, sensitive passwords, or other high-stakes accounts in it. This version intentionally does not load browser extensions. Chromium's private Chrome Sync integrations and Chrome settings parity are not available. The optional updater still needs a hosted release feed, and live Windows installation / Google website authentication have not been verified.

## Source commands

- `npm install` — fetch dependencies
- `npm run check` — syntax checks and unit tests
- `npm start` — development launch
- `npm run build:win` — build Windows NSIS installer
- `python tests/preview.py` — test the UI layout in headless Chromium (requires Playwright and its browser)

