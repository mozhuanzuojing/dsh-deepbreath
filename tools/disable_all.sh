#!/usr/bin/env bash
# 卸载 dsh-deepbreath 的计划任务（macOS / Linux）。用法： bash disable_all.sh
set -uo pipefail
LA="$HOME/Library/LaunchAgents"
OS="$(uname -s)"
case "$OS" in
  Linux)
    ( crontab -l 2>/dev/null | grep -v 'dsh-deepbreath' || true ) | crontab - 2>/dev/null || true
    echo "已从 crontab 移除 dsh-deepbreath 条目（正在运行的记账服务可用 pkill -f recorder.py 结束）。"
    ;;
  Darwin)
    for n in recorder daily; do
      p="$LA/com.dsh.deepbreath.$n.plist"
      launchctl unload "$p" 2>/dev/null || true
      rm -f "$p"
    done
    echo "已卸载并删除 launchd plist。"
    ;;
  *) echo "未知系统：$OS";;
esac
