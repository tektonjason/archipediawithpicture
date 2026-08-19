param(
  [string]$SiteRoot = "C:\Sites\archipedia",
  [string]$ProjectRoot = "",
  [string]$NodePath = "node",
  [int]$MinimumItems = 12,
  [int]$MinimumImageItems = 8
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$ScriptPath = Join-Path $ProjectRoot "utils\update-news-cache.mjs"
$OutputPath = Join-Path $SiteRoot "news-cache.json"
$CandidatePath = "$OutputPath.next"
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

Remove-Item -LiteralPath $CandidatePath -Force -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $OutputPath) {
  Copy-Item -LiteralPath $OutputPath -Destination $CandidatePath -Force
}

$TempOut = Join-Path $LogDir "news-update.stdout.tmp"
$TempErr = Join-Path $LogDir "news-update.stderr.tmp"
Remove-Item -LiteralPath $TempOut, $TempErr -Force -ErrorAction SilentlyContinue

$ArgumentList = @("`"$ScriptPath`"", "--out", "`"$CandidatePath`"")
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
  Remove-Item -LiteralPath $CandidatePath -Force -ErrorAction SilentlyContinue
  throw "News updater failed with exit code $NodeExitCode. See $LogPath"
}

$Cache = Get-Content -LiteralPath $CandidatePath -Raw -Encoding UTF8 | ConvertFrom-Json
$Items = @($Cache.items)
$ImageItems = @($Items | Where-Object { ![string]::IsNullOrWhiteSpace($_.imageUrl) })
$RealItemCount = if ($null -ne $Cache.stats.realItemCount) {
  [int]$Cache.stats.realItemCount
} else {
  $Items.Count
}

if ($RealItemCount -lt $MinimumItems -or $ImageItems.Count -lt $MinimumImageItems) {
  Remove-Item -LiteralPath $CandidatePath -Force -ErrorAction SilentlyContinue
  throw "News candidate rejected: $RealItemCount real items, $($ImageItems.Count) image items. Existing cache was preserved."
}

Move-Item -LiteralPath $CandidatePath -Destination $OutputPath -Force

$done = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$done] Done: $RealItemCount real items, $($ImageItems.Count) image items" | Tee-Object -FilePath $LogPath -Append
