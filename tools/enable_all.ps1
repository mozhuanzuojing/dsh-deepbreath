# 注册 dsh-deepbreath 的「记账服务(登录自启)」+「每日漏做检查」到 Windows 计划任务。
# 前置：已用 setup_mail.py 生成 config.json / .env；已安装 Python 3 并在 PATH。
# 用法： powershell -ExecutionPolicy Bypass -File .\enable_all.ps1
$ErrorActionPreference = 'Stop'
$base = $PSScriptRoot

$pyw = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source
if (-not $pyw) { $pyw = (Get-Command python.exe -ErrorAction SilentlyContinue).Source }
if (-not $pyw) { Write-Host '未找到 Python，请先安装 Python 3 并加入 PATH。'; exit 1 }

$chkHour = 22
try { $c = Get-Content (Join-Path $base 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json; if ($null -ne $c.check_hour) { $chkHour = [int]$c.check_hour } } catch {}
$t = "{0:D2}:00" -f $chkHour

schtasks /Create /SC ONLOGON /TN "dsh-deepbreath-recorder"    /TR "`"$pyw`" `"$base\recorder.py`""    /F
schtasks /Create /SC DAILY  /ST $t /TN "dsh-deepbreath-daily-check" /TR "`"$pyw`" `"$base\check_missed.py`"" /F
Start-Process -FilePath $pyw -ArgumentList "`"$base\recorder.py`"" -WindowStyle Hidden

Write-Host "已注册：dsh-deepbreath-recorder(登录自启) + dsh-deepbreath-daily-check(每日 $t)"
