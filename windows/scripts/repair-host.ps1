$ErrorActionPreference = 'Stop'

function Find-YMusicApp {
    $standard = Join-Path $env:LOCALAPPDATA 'Programs\YandexMusic'
    if (Test-Path -LiteralPath (Join-Path $standard 'resources\app.asar') -PathType Leaf) { return $standard }
    $candidates = @()
    foreach ($root in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall')) {
        foreach ($item in Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue) {
            $entry = Get-ItemProperty -LiteralPath $item.PSPath -ErrorAction SilentlyContinue
            if ($entry.InstallLocation -and ($entry.DisplayName -in @('Яндекс Музыка', 'Яндекс.Музыка', 'Yandex Music') -or
                $item.PSChildName -match '^(YandexMusic|yandex-music|ru\.yandex\.desktop\.music)$')) {
                $candidates += $entry.InstallLocation
            }
        }
    }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath (Join-Path $candidate 'resources\app.asar') -PathType Leaf) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
}

function Get-YMusicAsarStamp([string]$Asar) {
    $file = Get-Item -LiteralPath $Asar
    return "$($file.Length):$($file.LastWriteTimeUtc.Ticks)"
}

function Test-YMusicPatched([string]$Asar) {
    $share = [IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete
    $stream = [IO.File]::Open($Asar, 'Open', 'Read', $share)
    $reader = [IO.BinaryReader]::new($stream)
    try {
        $stream.Position = 12
        $size = $reader.ReadUInt32()
        if ($size -lt 2 -or $size -gt 16MB -or $size -gt $stream.Length - 16) {
            throw 'Invalid ASAR header. Yandex Music may still be updating.'
        }
        $header = [Text.Encoding]::UTF8.GetString($reader.ReadBytes($size))
        return $header.Contains('"ymmods-boot.js"')
    } finally { $reader.Dispose() }
}

function Repair-YMusicLoader([string]$MusicHome) {
    $modloader = Join-Path $MusicHome 'modloader'
    $main = Join-Path $modloader 'main.js'
    $preload = Join-Path $modloader 'preload.js'
    $mainText = [IO.File]::ReadAllText($main)
    $preloadText = [IO.File]::ReadAllText($preload)
    if ($mainText.Contains('// BEGIN YMC_UPDATE') -and $mainText.Contains('// BEGIN YMC_DISCORD PRESENCE') -and
        $preloadText.Contains('// BEGIN YMC_UPDATE')) { return }

    . (Join-Path $PSScriptRoot 'discord-loader.ps1')
    $formatter = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'discord-activity.cjs'))
    $updater = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'update.cjs'))
    $nextMain = Edit-UpdateLoader (Edit-DiscordLoader $mainText $formatter) $updater
    $nextPreload = Edit-UpdateLoader $preloadText $updater -Preload
    $id = [Guid]::NewGuid().ToString('N')
    if ($nextMain -cne $mainText) { Set-DiscordLoader $main $mainText $nextMain ($main + '.ymc-backup.' + $id) }
    if ($nextPreload -cne $preloadText) { Set-DiscordLoader $preload $preloadText $nextPreload ($preload + '.ymc-backup.' + $id) }
}

$lock = [Threading.Mutex]::new($false, 'Local\YMusicCustomizerSetup')
$acquired = $false
try {
    try { $acquired = $lock.WaitOne(0) } catch [Threading.AbandonedMutexException] { $acquired = $true }
    if (-not $acquired) { return }
    $musicHome = Join-Path $env:APPDATA 'YandexMusic'
    $mod = Join-Path $musicHome 'mods\ymusic-customizer.js'
    if (-not (Test-Path -LiteralPath $mod -PathType Leaf)) { return }
    $watcher = Join-Path $musicHome 'modloader\watch-update.ps1'
    $appDir = Find-YMusicApp
    if (-not $appDir -or -not (Test-Path -LiteralPath $watcher -PathType Leaf)) { return }
    $asar = Join-Path $appDir 'resources\app.asar'
    if (Test-YMusicPatched $asar) {
        Repair-YMusicLoader $musicHome
        return
    }
    $appPrefix = $appDir.TrimEnd('\') + '\'
    $updaterPrefix = (Join-Path $env:LOCALAPPDATA 'yandexmusic-updater') + '\'
    $busy = Get-Process | Where-Object { $_.Name -like 'Yandex_Music*' -or $_.Name -like 'Un_*' -or
        ($_.Path -and ($_.Path.StartsWith($appPrefix, [StringComparison]::OrdinalIgnoreCase) -or
                       $_.Path.StartsWith($updaterPrefix, [StringComparison]::OrdinalIgnoreCase))) } | Select-Object -First 1
    if ($busy) { return }

    $stamp = Get-YMusicAsarStamp $asar
    $statusFile = Join-Path $PSScriptRoot 'host-repair-status.txt'
    # Give the loader's own updater time to repair app.asar before trying independently.
    if (((Get-Date).ToUniversalTime() - (Get-Item -LiteralPath $asar).LastWriteTimeUtc).TotalSeconds -lt 90) { return }
    $previous = Get-Item -LiteralPath $statusFile -ErrorAction SilentlyContinue
    if ($previous -and ((Get-Date).ToUniversalTime() - $previous.LastWriteTimeUtc).TotalMinutes -lt 15 -and
        [IO.File]::ReadAllText($statusFile) -eq $stamp) { return }
    $runningWatcher = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($watcher) } | Select-Object -First 1
    if ($runningWatcher) { return }
    if ((Get-YMusicAsarStamp $asar) -ne $stamp -or (Test-YMusicPatched $asar)) { return }
    [IO.File]::WriteAllText($statusFile, $stamp)
    $powershell = Join-Path $PSHOME 'powershell.exe'
    & $powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $watcher -Mode repair -AppDir $appDir -NoLaunch
    if ($LASTEXITCODE -ne 0 -or -not (Test-YMusicPatched $asar)) { throw 'ymusic_mod could not restore the updated Yandex Music client.' }
    Repair-YMusicLoader $musicHome
} catch {
    Add-Content -LiteralPath (Join-Path $PSScriptRoot 'host-repair.log') -Value ("[{0:s}] {1}" -f (Get-Date), $_.Exception.Message) -Encoding UTF8
    exit 1
} finally {
    if ($acquired) { $lock.ReleaseMutex() }
    $lock.Dispose()
}
