// This runs in the graphical Windows Script Host, before PowerShell starts.
var shell = new ActiveXObject('WScript.Shell');
var files = new ActiveXObject('Scripting.FileSystemObject');
var powershell = files.BuildPath(files.GetSpecialFolder(0).Path,
    'System32\\WindowsPowerShell\\v1.0\\powershell.exe');
var script = files.BuildPath(files.GetParentFolderName(WScript.ScriptFullName), 'repair-host.ps1');
var command = '"' + powershell + '" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + script + '"';

// Hide the window at process creation. Waiting keeps Task Scheduler's IgnoreNew policy effective.
WScript.Quit(shell.Run(command, 0, true));
