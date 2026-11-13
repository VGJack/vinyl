$ErrorActionPreference = 'Stop'
$root = Join-Path ([IO.Path]::GetTempPath()) ('vinyl-location-check-' + [guid]::NewGuid().ToString('N'))
$regKey = 'Software\VinylInstallerTest-' + [guid]::NewGuid().ToString('N')
$compiler = Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'electron-builder\Cache') -Filter makensis.exe -Recurse | Select-Object -First 1 -ExpandProperty FullName
if (!$compiler) { throw 'Build Vinyl once to populate the NSIS compiler cache.' }
$include = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../scripts/installer.nsh'))
$stream = $null
try {
    New-Item -ItemType Directory -Path $root | Out-Null
    foreach ($mode in @('missing','existing','locked')) {
        $destination = Join-Path $root $mode
        if ($mode -ne 'missing') { New-Item -ItemType Directory -Path $destination | Out-Null }
        if ($mode -eq 'locked') {
            $stream = [IO.File]::Open((Join-Path $destination 'Uninstall Vinyl.exe'),[IO.FileMode]::Create,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
        }
        $source = @'
Unicode true
!include LogicLib.nsh
!include FileFunc.nsh
!define INSTALL_REGISTRY_KEY "__REG__"
!define APP_FILENAME "Vinyl"
!define APP_EXECUTABLE_FILENAME "Vinyl.exe"
!define PRODUCT_FILENAME "Vinyl"
!define VINYL_USER_INSTALL_ROOT "__ROOT__\fallback"
!include "__INCLUDE__"
Name "Vinyl installer preflight test"
OutFile "__ROOT__\test-__MODE__.exe"
RequestExecutionLevel user
SilentInstall silent
Var installMode
Var appExe
Section
  StrCpy $installMode CurrentUser
  StrCpy $INSTDIR "__DEST__"
  WriteRegStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  !insertmacro vinylInstallPreflight
  FileOpen $0 "__ROOT__\result-__MODE__.txt" w
  FileWrite $0 "$INSTDIR"
  FileClose $0
  DeleteRegKey HKCU "${INSTALL_REGISTRY_KEY}"
SectionEnd
'@
        $source = $source.Replace('__REG__',$regKey).Replace('__ROOT__',$root).Replace('__INCLUDE__',$include).Replace('__MODE__',$mode).Replace('__DEST__',$destination)
        $file = Join-Path $root 'test.nsi'
        Set-Content -LiteralPath $file -Value $source -Encoding UTF8
        & $compiler /V2 $file
        if ($LASTEXITCODE -ne 0) { throw 'Preflight test did not compile' }
        $run = Start-Process -FilePath (Join-Path $root "test-$mode.exe") -WindowStyle Hidden -Wait -PassThru
        if ($mode -eq 'locked') {
            if ($run.ExitCode -ne 5 -or (Test-Path (Join-Path $root 'result-locked.txt'))) { throw 'Locked uninstaller was not rejected before installation' }
            $stream.Dispose(); $stream = $null
        } else {
            if ($run.ExitCode -ne 0) { throw "Preflight failed: $mode" }
            $actual = Get-Content -LiteralPath (Join-Path $root "result-$mode.txt") -Raw
            $expected = if ($mode -eq 'missing') { Join-Path $root 'fallback\Vinyl' } else { $destination }
            if ($actual -ne $expected) { throw "Wrong install destination for $mode : $actual" }
        }
    }
    Write-Output 'Installer preflight passed: missing-folder recovery, live location preserved, locked uninstaller rejected before replacement.'
} finally {
    if ($stream) { $stream.Dispose() }
    Remove-Item -LiteralPath "HKCU:\$regKey" -Force -ErrorAction SilentlyContinue
    if ([IO.Path]::GetFullPath($root).StartsWith([IO.Path]::GetFullPath([IO.Path]::GetTempPath()),[StringComparison]::OrdinalIgnoreCase)) { Remove-Item -LiteralPath $root -Recurse -Force }
}
