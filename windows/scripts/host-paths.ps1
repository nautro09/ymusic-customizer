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
