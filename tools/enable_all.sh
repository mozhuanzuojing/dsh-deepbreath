#!/usr/bin/env bash
# dsh-deepbreath 计划任务安装（macOS / Linux）。前置：Python 3；已用 setup_mail.py 生成 config.json / .env。
# 用法： bash enable_all.sh
set -euo pipefail
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then echo "未找到 python3/python，请先安装 Python 3。"; exit 1; fi

CHK_HOUR=22
if [ -f "$BASE/config.json" ]; then
  H="$("$PY" - "$BASE/config.json" <<'PYEOF' 2>/dev/null || echo 22
import json,sys
print(json.load(open(sys.argv[1])).get('check_hour', 22))
PYEOF
)"
  case "$H" in ''|*[!0-9]*) H=22;; esac
  CHK_HOUR="$H"
fi

OS="$(uname -s)"
case "$OS" in
  Linux)
    ( crontab -l 2>/dev/null | grep -v 'dsh-deepbreath' || true
      echo "@reboot $PY \"$BASE/recorder.py\" >> \"$BASE/recorder.log\" 2>&1 # dsh-deepbreath-recorder"
      echo "0 $CHK_HOUR * * * $PY \"$BASE/check_missed.py\" >> \"$BASE/check.log\" 2>&1 # dsh-deepbreath-daily"
    ) | crontab -
    nohup "$PY" "$BASE/recorder.py" >> "$BASE/recorder.log" 2>&1 &
    echo "已写入 crontab（@reboot 记账 + 每日 $CHK_HOUR:00 检查），并已启动记账服务。"
    ;;
  Darwin)
    LA="$HOME/Library/LaunchAgents"; mkdir -p "$LA"
    cat > "$LA/com.dsh.deepbreath.recorder.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.dsh.deepbreath.recorder</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ProgramArguments</key><array><string>$PY</string><string>$BASE/recorder.py</string></array>
  <key>StandardOutPath</key><string>$BASE/recorder.log</string>
  <key>StandardErrorPath</key><string>$BASE/recorder.log</string>
</dict></plist>
PLIST
    cat > "$LA/com.dsh.deepbreath.daily.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.dsh.deepbreath.daily</string>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$CHK_HOUR</integer><key>Minute</key><integer>0</integer></dict>
  <key>ProgramArguments</key><array><string>$PY</string><string>$BASE/check_missed.py</string></array>
  <key>StandardOutPath</key><string>$BASE/check.log</string>
  <key>StandardErrorPath</key><string>$BASE/check.log</string>
</dict></plist>
PLIST
    launchctl unload "$LA/com.dsh.deepbreath.recorder.plist" 2>/dev/null || true
    launchctl unload "$LA/com.dsh.deepbreath.daily.plist" 2>/dev/null || true
    launchctl load "$LA/com.dsh.deepbreath.recorder.plist"
    launchctl load "$LA/com.dsh.deepbreath.daily.plist"
    echo "已安装 launchd（记账 KeepAlive + 每日 $CHK_HOUR:00 检查）。"
    ;;
  *) echo "未知系统：$OS（仅支持 Linux / macOS，Windows 请用 enable_all.ps1）"; exit 1;;
esac
