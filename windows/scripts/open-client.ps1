$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'host-paths.ps1')
    $directory = Find-YMusicApp
    if (-not $directory) { throw 'Не удалось найти установленную Яндекс Музыку.' }
    $exe = @('Яндекс Музыка.exe','Yandex Music.exe','Yandex_Music.exe','YandexMusic.exe') |
        ForEach-Object { Join-Path $directory $_ } |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    if (-not $exe) { throw 'Не найден исполняемый файл Яндекс Музыки.' }
    $repair = Join-Path $env:APPDATA 'YandexMusic\customizer-repair\repair-host.ps1'
    if (Test-Path -LiteralPath $repair) {
        Write-Host 'Проверяю версию клиента перед открытием…'
        & (Join-Path $PSHOME 'powershell.exe') -NoProfile -File $repair -BeforeLaunch
        if ($LASTEXITCODE) { throw 'Не удалось подготовить Customizer. Подробности находятся в host-repair.log.' }
    }
    Start-Process -FilePath $exe -WorkingDirectory $directory
} catch { Write-Host $_.Exception.Message; exit 1 }
