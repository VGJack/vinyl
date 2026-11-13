$ErrorActionPreference = 'Stop'
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('vinyl-installer-check-' + [guid]::NewGuid().ToString('N'))
$target = Join-Path $testRoot 'target'
$other = Join-Path $testRoot 'other'
$testProcesses = @()
try {
    New-Item -ItemType Directory -Path $target,$other | Out-Null
    # Harmless local ping processes stand in for installed copies and setup.
    foreach ($file in @((Join-Path $target 'Vinyl.exe'),(Join-Path $other 'Vinyl.exe'),(Join-Path $target 'Vinyl-Setup.exe'))) {
        Copy-Item -LiteralPath (Join-Path $env:WINDIR 'System32\PING.EXE') -Destination $file
        $testProcesses += Start-Process -FilePath $file -ArgumentList '-t','127.0.0.1' -WindowStyle Hidden -PassThru
    }
    Start-Sleep -Milliseconds 200
    $script = Join-Path $PSScriptRoot '../scripts/close-installed-app.ps1'
    & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $script -InstallDirectory $target -CheckOnly
    if ($LASTEXITCODE -ne 10) { throw 'Installed app was not detected' }
    & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $script -InstallDirectory $target
    if ($LASTEXITCODE -ne 0) { throw 'Installed app could not be closed' }
    $testProcesses | ForEach-Object { $_.Refresh() }
    if (!$testProcesses[0].HasExited) { throw 'Target process is still running' }
    if ($testProcesses[1].HasExited) { throw 'Another installation was affected' }
    if ($testProcesses[2].HasExited) { throw 'Setup was mistaken for the application' }
    & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $script -InstallDirectory $target -CheckOnly
    if ($LASTEXITCODE -ne 0) { throw 'Setup was reported as a running app' }
    Write-Output 'Installer process tests passed: exact executable match; other installation and setup preserved.'
} finally {
    foreach ($testProcess in $testProcesses) { if (!$testProcess.HasExited) { Stop-Process -Id $testProcess.Id -Force -ErrorAction SilentlyContinue } }
    # This generated, absolute test directory is the only cleanup target.
    if ([IO.Path]::GetFullPath($testRoot).StartsWith([IO.Path]::GetFullPath([IO.Path]::GetTempPath()),[StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}
