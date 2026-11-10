function Add-DiscordLoaderBlock([string]$Text, [string]$Anchor, [string]$Block) {
    $index = $Text.IndexOf($Anchor, [StringComparison]::Ordinal)
    if ($index -lt 0 -or $Text.IndexOf($Anchor, $index + 1, [StringComparison]::Ordinal) -ge 0) {
        throw 'Текущая версия ymusic_mod несовместима с обновлением Discord в Customizer.'
    }
    return $Text.Insert($index, $Block)
}

function Edit-DiscordLoader([string]$Text, [string]$Formatter = '') {
    $blockPattern = '(?ms)^ *// BEGIN YMC_DISCORD (FORMAT|PRESENCE)\r?\n.*?^ *// END YMC_DISCORD \1\r?\n'
    $linePattern = '(?m)^.* // YMC_DISCORD\r?\n'
    if ($Text.Contains('YMC_DISCORD')) {
        if ([regex]::Matches($Text, $blockPattern).Count -ne 2 -or [regex]::Matches($Text, $linePattern).Count -ne 1) {
            throw 'Не удалось безопасно обновить изменения Customizer в загрузчике.'
        }
        $Text = [regex]::Replace([regex]::Replace($Text, $blockPattern, ''), $linePattern, '')
        if ($Text.Contains('YMC_DISCORD')) { throw 'В загрузчике остались неизвестные отметки Customizer.' }
    }
    if (-not $Formatter) { return $Text }

    $eol = if ($Text.Contains("`r`n")) { "`r`n" } else { "`n" }
    $formatBlock = @'
// BEGIN YMC_DISCORD FORMAT
const ymcDiscordActivity = (() => {
  const module = { exports: {} };
__FORMATTER__
  return module.exports;
})();
// END YMC_DISCORD FORMAT
'@
    $formatBlock = [regex]::Replace($formatBlock.Replace('__FORMATTER__', $Formatter.TrimEnd()), '\r?\n', $eol)
    $Text = Add-DiscordLoaderBlock $Text ('const { DiscordPresence, activityFor } = require("./discord");' + $eol) ($formatBlock + $eol)
    $Text = Add-DiscordLoaderBlock $Text ('    discordShowPaused: false,' + $eol) ('    discordShowAlbum: false, // YMC_DISCORD' + $eol)
    $presence = @'
    // BEGIN YMC_DISCORD PRESENCE
    if (fs.existsSync(path.join(modsDir, "ymusic-customizer.js"))) {
      const track = ymcDiscordActivity.trackData(trackState);
      discord.setActivity(ymcDiscordActivity.activityFor(track, {
        showPaused: !!cfg.discordShowPaused,
        showAlbum: cfg.discordShowAlbum === true
      }));
      return;
    }
    // END YMC_DISCORD PRESENCE
'@
    $presence = [regex]::Replace($presence.TrimEnd(), '\r?\n', $eol)
    return Add-DiscordLoaderBlock $Text ('    const lang = (trackState.lang || "").slice(0, 2);' + $eol) ($presence + $eol)
}

function Set-DiscordLoader([string]$Path, [string]$Previous, [string]$Next, [string]$Backup) {
    $pending = $Backup + '.tmp'
    try {
        $bytes = [IO.File]::ReadAllBytes($Path)
        $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191
        [IO.File]::WriteAllText($pending, $Next, [Text.UTF8Encoding]::new($hasBom))
        if ([IO.File]::ReadAllText($Path) -cne $Previous) {
            throw 'Загрузчик изменился во время установки. Запустите установщик ещё раз.'
        }
        [IO.File]::Replace($pending, $Path, $Backup)
    } finally {
        if (Test-Path -LiteralPath $pending -PathType Leaf) { Remove-Item -LiteralPath $pending -Force }
    }
}

function Edit-UpdateLoader([string]$Text, [string]$Updater = '', [switch]$Preload) {
    $pattern = '(?ms)^ *// BEGIN YMC_UPDATE\r?\n.*?^ *// END YMC_UPDATE\r?\n'
    if ($Text.Contains('YMC_UPDATE')) {
        # The native update code also uses YMC_UPDATE_* environment variables.
        if ([regex]::Matches($Text, $pattern).Count -ne 1) { throw 'Блок обновлений Customizer в загрузчике повреждён.' }
        $Text = [regex]::Replace($Text, $pattern, '')
    }
    if (-not $Updater) { return $Text }
    $eol = if ($Text.Contains("`r`n")) { "`r`n" } else { "`n" }
    if ($Preload) {
        $anchor = '    getState: () => ipcRenderer.invoke("ymmods:get"),'
        $block = @'
    // BEGIN YMC_UPDATE
    checkUpdate: () => ipcRenderer.invoke("ymc:update:check"),
    installUpdate: () => ipcRenderer.invoke("ymc:update:install"),
    musicPlus: (action, value) => ["status", "check", "install", "remove", "connect", "search", "cancel", "open"].includes(action)
      ? ipcRenderer.invoke("ymc:music-plus:" + action, value) : null,
    // END YMC_UPDATE
'@
    } else {
        $anchor = '  const configFile = path.join(modsDir, "config.json");'
        $block = @'
  // BEGIN YMC_UPDATE
  const ymcUpdater = (() => {
    const module = { exports: {} };
__UPDATER__
    return module.exports;
  })();
  ymcUpdater.attachUpdater(app, ipcMain, event => {
    const frame = event.senderFrame;
    return Boolean(frame && frame === event.sender.mainFrame &&
      /^music-application:\/\/desktop(?:\/|$)/.test(frame.url) &&
      fs.existsSync(path.join(modsDir, 'ymusic-customizer.js')));
  });
  // END YMC_UPDATE
'@
        $block = $block.Replace('__UPDATER__', $Updater.TrimEnd())
    }
    $block = [regex]::Replace($block.TrimEnd(), '\r?\n', $eol)
    return Add-DiscordLoaderBlock $Text ($anchor + $eol) ($block + $eol)
}
