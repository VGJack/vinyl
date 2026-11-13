param([Parameter(Mandatory = $true)][string]$InstallDirectory, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
# Match the installed executable exactly. A directory-prefix match also finds
# setup/uninstall executables inside the installation folder and can kill itself.
$vinylExecutable = [IO.Path]::GetFullPath((Join-Path $InstallDirectory 'Vinyl.exe'))
function Get-InstalledVinyl {
    @(Get-Process -Name Vinyl -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -and [string]::Equals($_.Path, $vinylExecutable, [StringComparison]::OrdinalIgnoreCase)
    })
}
try {
    $vinylProcesses = @(Get-InstalledVinyl)
    if ($CheckOnly) { if ($vinylProcesses.Count) { exit 10 }; exit 0 }
    foreach ($vinylProcess in $vinylProcesses) { [void]$vinylProcess.CloseMainWindow() }
    $vinylDeadline = [DateTime]::UtcNow.AddSeconds(5)
    while ((Get-InstalledVinyl).Count -and [DateTime]::UtcNow -lt $vinylDeadline) { Start-Sleep -Milliseconds 100 }
    # Only the selected installation may be stopped; other apps/profiles are untouched.
    foreach ($vinylProcess in @(Get-InstalledVinyl)) { Stop-Process -Id $vinylProcess.Id -Force -ErrorAction SilentlyContinue }
    $vinylDeadline = [DateTime]::UtcNow.AddSeconds(5)
    while ((Get-InstalledVinyl).Count -and [DateTime]::UtcNow -lt $vinylDeadline) { Start-Sleep -Milliseconds 100 }
    if ((Get-InstalledVinyl).Count) { exit 1 }
    exit 0
} catch { Write-Output $_.Exception.Message; exit 1 }
