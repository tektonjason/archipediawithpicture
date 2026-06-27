param(
  [string]$SiteRoot = "C:\Sites\archipedia",
  [string]$ProjectRoot = "",
  [string]$TaskName = "ARCHIPEDIA Daily News Update",
  [string]$DailyTime = "03:30",
  [string]$NodePath = "node"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$Updater = Join-Path $ProjectRoot "server-scripts\update-news-cache.ps1"

if (!(Test-Path -LiteralPath $Updater)) {
  throw "Cannot find updater PowerShell script: $Updater"
}

if (!(Test-Path -LiteralPath $SiteRoot)) {
  throw "Cannot find IIS site root: $SiteRoot"
}

$PowerShell = Join-Path $PSHOME "powershell.exe"
$Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Updater`" -SiteRoot `"$SiteRoot`" -ProjectRoot `"$ProjectRoot`" -NodePath `"$NodePath`""

$Action = New-ScheduledTaskAction -Execute $PowerShell -Argument $Arguments
$Trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::ParseExact($DailyTime, "HH:mm", $null))
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null

Write-Host "Installed scheduled task: $TaskName"
Write-Host "Daily time: $DailyTime"
Write-Host "Site root: $SiteRoot"
Write-Host "Project root: $ProjectRoot"
Write-Host ""
Write-Host "Run once now with:"
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$Updater`" -SiteRoot `"$SiteRoot`" -ProjectRoot `"$ProjectRoot`" -NodePath `"$NodePath`""
