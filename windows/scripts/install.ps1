param([ValidateSet('Install','Uninstall','Status')][string]$Mode = 'Install')
$ErrorActionPreference = 'Stop'

function Install-Loader([string]$MusicHome, [string]$Loader, [string]$PendingLoader) {
    $url = 'https://github.com/nersuga/ymusic_mod/releases/download/v1.5.0/YandexMusicMods-Setup-1.5.0.exe'
    $expectedHash = '1EDD5ACD7729B8579FCA7C67E5D17DEEFC5295F9E07AC11D4FD02CA688BB8C31'
    $setup = Join-Path ([IO.Path]::GetTempPath()) ('YMusicCustomizer-' + [Guid]::NewGuid().ToString('N') + '.exe')

    try {
        Write-Host 'Скачиваю ymusic_mod 1.5.0 с GitHub…'
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        try {
            Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $setup -TimeoutSec 60
        } catch {
            throw ('Не удалось скачать ymusic_mod с GitHub. Проверьте подключение и запустите УСТАНОВИТЬ.bat ещё раз. ' + $_.Exception.Message)
        }
        if ((Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash -ne $expectedHash) {
            throw 'Контрольная сумма ymusic_mod не совпала. Скачанный установщик не запущен.'
        }

        # Загрузчик может скопировать main.js до того, как пропатчит приложение.
        New-Item -ItemType Directory -Path $MusicHome -Force | Out-Null
        New-Item -ItemType File -Path $PendingLoader -Force | Out-Null
        Write-Host 'Устанавливаю ymusic_mod…'
        $process = Start-Process -FilePath $setup -ArgumentList '-Action', 'install', '-Silent', '-NoLaunch' -WindowStyle Hidden -PassThru -Wait
        if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $Loader -PathType Leaf)) {
            throw ('Не удалось установить ymusic_mod (код ' + $process.ExitCode + '). Проверьте, что настольная Яндекс Музыка установлена, и повторите попытку.')
        }
        Remove-Item -LiteralPath $PendingLoader
    } finally {
        if (Test-Path -LiteralPath $setup -PathType Leaf) { Remove-Item -LiteralPath $setup -Force }
    }
}

$installLock = $null
$lockAcquired = $false
try {
    if (-not $env:APPDATA) { throw 'Не задан APPDATA.' }
    if ($Mode -ne 'Status') {
        $installLock = [Threading.Mutex]::new($false, 'Local\YMusicCustomizerSetup')
        try {
            $lockAcquired = $installLock.WaitOne(0)
        } catch [Threading.AbandonedMutexException] {
            $lockAcquired = $true
        }
        if (-not $lockAcquired) { throw 'Установщик Customizer уже запущен. Дождитесь его завершения.' }
    }
    $root = Split-Path -Parent $PSScriptRoot
    $musicHome = Join-Path $env:APPDATA 'YandexMusic'
    $mods = Join-Path $musicHome 'mods'
    $loader = Join-Path (Join-Path $musicHome 'modloader') 'main.js'
    $preload = Join-Path (Split-Path -Parent $loader) 'preload.js'
    $pendingLoader = Join-Path $musicHome '.ymusic-customizer-loader-pending'
    $active = Join-Path $mods 'ymusic-customizer.js'
    $disabled = Join-Path $mods '_ymusic-customizer.js'
    $hasActive = Test-Path -LiteralPath $active -PathType Leaf
    $hasDisabled = Test-Path -LiteralPath $disabled -PathType Leaf
    $hasLoader = (Test-Path -LiteralPath $loader -PathType Leaf) -and -not (Test-Path -LiteralPath $pendingLoader -PathType Leaf)

    if ($Mode -eq 'Status') {
        Write-Host ("ymusic_mod: " + $hasLoader)
        Write-Host ("Customizer (активный файл): " + $hasActive)
        Write-Host ("Customizer (отключённый файл): " + $hasDisabled)
        Write-Host ("Папка модов: " + $mods)
        exit 0
    }
    if ($Mode -eq 'Uninstall') {
        if ($hasLoader) {
            . (Join-Path $PSScriptRoot 'discord-loader.ps1')
            $loaderText = [IO.File]::ReadAllText($loader)
            $originalLoader = Edit-UpdateLoader (Edit-DiscordLoader $loaderText)
            if (Test-Path -LiteralPath $preload -PathType Leaf) {
                $preloadText = [IO.File]::ReadAllText($preload)
                $originalPreload = Edit-UpdateLoader $preloadText
                if ($originalPreload -cne $preloadText) {
                    Set-DiscordLoader $preload $preloadText $originalPreload ($preload + '.ymc-backup.' + [Guid]::NewGuid().ToString('N'))
                }
            }
            if ($originalLoader -cne $loaderText) {
                $loaderBackup = $loader + '.ymc-backup.' + [Guid]::NewGuid().ToString('N')
                Set-DiscordLoader $loader $loaderText $originalLoader $loaderBackup
            }
        }
        foreach ($file in @($active, $disabled)) {
            if (Test-Path -LiteralPath $file -PathType Leaf) { Remove-Item -LiteralPath $file -Force }
        }
        Write-Host 'Customizer удалён. Перезапустите Яндекс Музыку.'
        Write-Host 'Резервные копии и локальные настройки сохранены.'
        exit 0
    }

    . (Join-Path $PSScriptRoot 'discord-loader.ps1')
    $source = Join-Path (Join-Path $root 'mod') 'ymusic-customizer.js'
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Распакуйте архив целиком, включая папку mod.' }
    $formatter = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'discord-activity.cjs'))
    if (-not $formatter.Trim()) { throw 'Не найден код карточки Discord. Распакуйте архив целиком.' }
    if (-not $hasLoader) { Install-Loader $musicHome $loader $pendingLoader }
    $loaderText = [IO.File]::ReadAllText($loader)
    $updater = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'update.cjs'))
    $patchedLoader = Edit-UpdateLoader (Edit-DiscordLoader $loaderText $formatter) $updater
    $preloadText = [IO.File]::ReadAllText($preload)
    $patchedPreload = Edit-UpdateLoader $preloadText $updater -Preload
    New-Item -ItemType Directory -Path $mods -Force | Out-Null

    $target = if ($hasDisabled -and -not $hasActive) { $disabled } else { $active }
    $id = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N')
    $pending = Join-Path $mods ('.ymusic-customizer.' + $id + '.tmp')
    $backup = $target + '.backup.' + $id
    $duplicateBackup = $disabled + '.backup.' + $id
    $loaderBackup = $loader + '.ymc-backup.' + $id
    $loaderChanged = $false
    $preloadBackup = $preload + '.ymc-backup.' + $id
    $preloadChanged = $false
    $movedDuplicate = $false
    try {
        Copy-Item -LiteralPath $source -Destination $pending
        if ($patchedLoader -cne $loaderText) {
            Set-DiscordLoader $loader $loaderText $patchedLoader $loaderBackup
            $loaderChanged = $true
        }
        if ($patchedPreload -cne $preloadText) {
            Set-DiscordLoader $preload $preloadText $patchedPreload $preloadBackup
            $preloadChanged = $true
        }
        if ($hasActive -and $hasDisabled) {
            [IO.File]::Move($disabled, $duplicateBackup)
            $movedDuplicate = $true
        }
        if ($hasActive -or $hasDisabled) {
            [IO.File]::Replace($pending, $target, $backup)
            Write-Host ("Резервная копия: " + $backup)
        } else {
            [IO.File]::Move($pending, $target)
        }
    } catch {
        try {
            if ($movedDuplicate -and -not (Test-Path -LiteralPath $disabled)) {
                [IO.File]::Move($duplicateBackup, $disabled)
            }
        } finally {
            if ($preloadChanged -and [IO.File]::ReadAllText($preload) -ceq $patchedPreload) {
                [IO.File]::Replace($preloadBackup, $preload, ($preloadBackup + '.failed'))
                Remove-Item -LiteralPath ($preloadBackup + '.failed') -Force
            }
            if ($loaderChanged -and [IO.File]::ReadAllText($loader) -ceq $patchedLoader) {
                $failedLoader = $loaderBackup + '.failed'
                [IO.File]::Replace($loaderBackup, $loader, $failedLoader)
                Remove-Item -LiteralPath $failedLoader -Force
            }
        }
        throw
    } finally {
        if (Test-Path -LiteralPath $pending -PathType Leaf) { Remove-Item -LiteralPath $pending -Force }
    }
    if ($movedDuplicate) { Write-Host ("Копия прежнего отключённого файла: " + $duplicateBackup) }
    Write-Host 'YMusic Customizer v0.7.0 установлен.' -ForegroundColor Green
    if ($target -eq $disabled) {
        Write-Host 'Мод был отключён. Включите его в разделе «Моды», затем перезапустите приложение.'
    } else {
        Write-Host 'Перезапустите Яндекс Музыку. Ctrl+Shift+Y открывает редактор.'
    }
    exit 0
} catch {
    Write-Host ("Ошибка: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally {
    if ($lockAcquired) { $installLock.ReleaseMutex() }
    if ($installLock) { $installLock.Dispose() }
}
