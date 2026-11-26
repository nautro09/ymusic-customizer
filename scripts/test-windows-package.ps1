param([Parameter(Mandatory)][string]$Directory, [Parameter(Mandatory)][string]$Tag)
$ErrorActionPreference = 'Stop'
$package = (Resolve-Path $Directory).Path
$archive = Join-Path $package 'YMusic-Customizer-Windows.zip'
$manifest = Get-Content (Join-Path $package 'update.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ("v$($manifest.version)" -ne $Tag -or (Get-FileHash $archive).Hash -ne $manifest.sha256.win32) {
    throw 'Unexpected Windows package.'
}
$stage = Join-Path $env:TEMP ('ymc-package-' + [Guid]::NewGuid().ToString('N'))
$env:APPDATA = Join-Path $stage 'roaming'
$env:LOCALAPPDATA = Join-Path $stage 'local'
Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $stage 'package')
$scripts = Join-Path $stage 'package\scripts'
foreach ($file in Get-ChildItem $scripts -Filter '*.ps1') {
    $errors = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$null, [ref]$errors)
    if ($errors) { throw ($errors | Out-String) }
}
& node --check (Join-Path $stage 'package\mod\ymusic-customizer.js')
if ($LASTEXITCODE) { throw 'Invalid renderer.' }
$music = Join-Path $env:APPDATA 'YandexMusic'
$loader = Join-Path $music 'modloader'
$resources = Join-Path $env:LOCALAPPDATA 'Programs\YandexMusic\resources'
New-Item -ItemType Directory -Path $resources, $loader -Force | Out-Null
$asar = Join-Path $resources 'app.asar'
$header = [Text.Encoding]::UTF8.GetBytes('{"files":{"ymmods-boot.js":{}}}')
[IO.File]::WriteAllBytes($asar, ([byte[]]::new(12) + [BitConverter]::GetBytes([int]$header.Length) + $header))
# Loader fixture containing the integration points used by the installer.
$main = @(
    'const { DiscordPresence, activityFor } = require("./discord");'
    '    discordShowPaused: false,'
    '    const lang = (trackState.lang || "").slice(0, 2);'
    '  const configFile = path.join(modsDir, "config.json");'
) -join [Environment]::NewLine
[IO.File]::WriteAllText((Join-Path $loader 'main.js'), ($main + [Environment]::NewLine))
[IO.File]::WriteAllText((Join-Path $loader 'preload.js'), ('    getState: () => ipcRenderer.invoke("ymmods:get"),' + [Environment]::NewLine))
New-Item -ItemType File -Path (Join-Path $loader 'watch-update.ps1') | Out-Null
$installer = Join-Path $scripts 'install.ps1'
$repair = Join-Path $music 'customizer-repair\repair-host.ps1'
$mod = Join-Path $music 'mods\ymusic-customizer.js'
$disabled = Join-Path $music 'mods\_ymusic-customizer.js'
function Run-Script([string]$Script, [string[]]$Arguments) {
    & powershell.exe -NoProfile -NonInteractive -File $Script @Arguments
    if ($LASTEXITCODE) { throw "Failed: $Script $Arguments" }
}
try {
    Run-Script $installer @('-Mode','Install')
    $expected = (Get-FileHash $mod).Hash
    # Repeat installation also exercises atomic cache replacement.
    Run-Script $installer @('-Mode','Install')
    Remove-Item -LiteralPath $mod
    [IO.File]::SetLastWriteTimeUtc($asar, [DateTime]::UtcNow.AddSeconds(5))
    Run-Script $repair
    if ((Get-FileHash $mod).Hash -ne $expected) { throw 'Host update lost the active renderer.' }
    Move-Item -LiteralPath $mod -Destination $disabled
    [IO.File]::SetLastWriteTimeUtc($asar, [DateTime]::UtcNow.AddSeconds(10))
    Run-Script $repair
    if (Test-Path $mod) { throw 'A disabled mod was re-enabled.' }
    Move-Item -LiteralPath $disabled -Destination $mod
    Run-Script $repair
    Remove-Item -LiteralPath $mod
    Run-Script $repair
    if (Test-Path $mod) { throw 'Intentional removal was undone.' }
} finally {
    Run-Script $installer @('-Mode','Uninstall')
}
if (Test-Path (Join-Path $music 'customizer-repair\renderer.js')) { throw 'Cache left after uninstall.' }
Write-Output 'PASS Windows PowerShell install, reinstall, changed host, disabled mod, manual removal, uninstall'
