# Vinyl 0.7.3

Vinyl is an Electron browser with a sculpted glass home page, detachable tabs, a bottom navigation dock, and an attached bookmark drawer.

## Install this version

Run `dist/Vinyl-Setup-0.7.3.exe` using the same Windows account as your existing copy. A stale per-user registration whose folder is missing is recovered to `%LOCALAPPDATA%\Programs\Vinyl`. Existing live installation locations are preserved. The application ID remains `app.vinyl.browser`; bookmarks, preferences, and site data stay in the existing user profile.

A local 0.6 build with an empty update configuration needs this manual upgrade once. The 0.7 installer embeds the `VGJack/vinyl` GitHub update feed. The published `v0.6` release had no installer or `latest.yml` assets when checked, so there was nothing for an updater to download.

## Browser controls

- Tabs, Settings, and native window controls occupy the top edge. Drag tabs horizontally to reorder; drag away from the strip and release to create a separate window. The live page, form contents, history, and session move with the tab. Escape cancels a drag. Ctrl+Shift+Left/Right reorders a focused tab with the keyboard.
- Bottom controls are separate floating buttons plus a compact address input. Controls stay visible until hidden with the clickable bottom drawer holder or Ctrl+Shift+H. Click the holder again or press Ctrl+L to reveal them. Opening Home and switching tabs preserve the drawer state. Choose Standard or Compact size in Settings.
- The bookmark-shaped button extends a rounded drawer outside the left edge of a normal window. The drawer follows window movement and hides when minimized. Vinyl moves the window inward when it needs space beside the display edge. Maximized and fullscreen windows use an internal drawer. F11 toggles fullscreen.
- The home page uses four compact quadrants: search/shortcuts, visual weather, four image news panels, and recent tabs. News comes from BBC RSS with the publisher-provided story images; weather comes from Open-Meteo and offers Hourly and 7 days views with condition symbols. Missing images or offline data are labeled rather than replaced with unrelated photos.
- The Toggles shelf is empty, ready for future site-specific tools. Home tabs use the outlined Vinyl logo.
- The home page uses raised glass edges, recessed previews, and soft cast shadows. Widgets pop into place. The startup V is concealed behind animated masks and unwinds behind moving curled edges. Reduced Motion disables these effects.
- The G button opens Google account sign-in directly in a Vinyl tab using the persistent browser session shared with Gmail and YouTube. No OAuth client ID is required. Google may reject embedded-browser sign-in; Chrome browser account sign-in and Sync are unavailable in Vinyl.

## Automatic updates

Push to `main` to ship an update. GitHub Actions runs the checks, versions and builds the installer, then makes the complete download available automatically. You do not need to bump versions, create tags, fill out release pages, or upload files. Installed Vinyl checks at startup and every five minutes, downloads newer builds automatically, and offers Restart to update in Settings → About Vinyl.

`update-config.json` points to `VGJack/vinyl`. The workflow manages GitHub's installer hosting internally and verifies the installer, `.blockmap`, and `latest.yml` before exposing a build to installed browsers. Failed builds leave the previous update available. See [GITHUB_RELEASES_SETUP.md](GITHUB_RELEASES_SETUP.md) for how push-to-update works. Update failures show a short message in Settings, not a raw server response or stack trace.

Before removing an old version, setup checks that the destination and existing uninstaller can be written. It stops with an actionable message for a protected directory or locked uninstaller. The installer checks the exact `Vinyl.exe` in the selected installation directory. It requests a normal close, then stops remaining processes from that copy if necessary. It does not treat setup/uninstaller executables in the same folder as the running application or stop a separate installation. The updater launches the installer silently and restarts Vinyl; shutdown explicitly closes all browser views.

## Development and validation

The repository root is this `vinyl` folder (the folder containing `package.json` and `.github`).

- `npm ci` — install locked dependencies.
- `npm start` — run the development browser.
- `npm run check` — syntax and unit checks, including updater lifecycle and release configuration.
- `npm run test:installer` — Windows regression test using harmless local fixture processes; verifies that only the target installation is stopped.
- `npm run test:installer-location` — compiles an isolated NSIS test to verify missing-folder recovery, preserving an existing installation path, and rejecting a locked uninstaller before replacement.
- `npm run test:runtime` — Electron integration checks; requires Playwright available as `playwright` or via `VINYL_PLAYWRIGHT`. Uses a fresh isolated profile under `tmp`, not your installed browser data. Exercises manual drawer visibility/Ctrl+L, pointer reordering, stable section switching and external/internal shelf placement, live tab transfer/history/form data, closing the source window, independent windows, Google website sign-in entry, and renderer errors.
- `npm run build:win` — build a local NSIS installer with the update feed, without publishing.
- `npm run test:updater-runtime` — verifies the update button, readable errors, and retry behavior in an isolated Electron profile. Add `-- --live` for a read-only check against the public update feed.

The application is not code-signed. Building an installer and passing isolated tests does not establish that an update from your particular installed copy has completed successfully. A real download/install/relaunch cycle from a published release still needs validation.
