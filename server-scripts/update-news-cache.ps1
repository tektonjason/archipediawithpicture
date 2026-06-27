param(
  [string]$SiteRoot = "C:\Sites\archipedia",
  [string]$ProjectRoot = "",
  [string]$NodePath = "node"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$ScriptPath = Join-Path $ProjectRoot "utils\update-news-cache.mjs"
$OutputPath = Join-Path $SiteRoot "news-cache.json"
$LogDir = Join-Path $ProjectRoot "logs"
$LogPath = Join-Path $LogDir "news-update.log"

if (!(Test-Path -LiteralPath $ScriptPath)) {
  throw "Cannot find updater script: $ScriptPath"
}

if (!(Test-Path -LiteralPath $SiteRoot)) {
  throw "Cannot find IIS site root: $SiteRoot"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$stamp] Updating ARCHIPEDIA news cache -> $OutputPath" | Tee-Object -FilePath $LogPath -Append

$TempOut = Join-Path $LogDir "news-update.stdout.tmp"
$TempErr = Join-Path $LogDir "news-update.stderr.tmp"
Remove-Item -LiteralPath $TempOut, $TempErr -Force -ErrorAction SilentlyContinue

$ArgumentList = @("`"$ScriptPath`"", "--out", "`"$OutputPath`"")
$Process = Start-Process -FilePath $NodePath -ArgumentList $ArgumentList -Wait -PassThru -WindowStyle Hidden -RedirectStandardOutput $TempOut -RedirectStandardError $TempErr
$NodeExitCode = $Process.ExitCode

if (Test-Path -LiteralPath $TempOut) {
  Get-Content -LiteralPath $TempOut | Tee-Object -FilePath $LogPath -Append
}
if (Test-Path -LiteralPath $TempErr) {
  Get-Content -LiteralPath $TempErr | Tee-Object -FilePath $LogPath -Append
}
Remove-Item -LiteralPath $TempOut, $TempErr -Force -ErrorAction SilentlyContinue

if ($NodeExitCode -ne 0) {
  throw "News updater failed with exit code $NodeExitCode. See $LogPath"
}

$done = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$done] Done" | Tee-Object -FilePath $LogPath -Append
